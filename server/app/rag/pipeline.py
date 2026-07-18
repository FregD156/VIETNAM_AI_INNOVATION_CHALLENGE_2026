from __future__ import annotations

import concurrent.futures
import json
import re
from typing import Any, Generator, Optional

from app.integrations.llm_client import ChatService
from app.rag.citation_guard import CitationGuard
from app.rag.conflict_detector import ConflictDetector
from app.rag.effective_resolver import EffectiveResolver
from app.rag.knowledge_graph import GraphService
from app.rag.retrieval import SearchService


SUB_QUERY_SCHEMA = {"type": "json_object"}


class RAGPipeline:
    MAX_CONTEXT_CHUNKS = 15
    MAX_DIRECT_CHUNKS = 10
    MAX_GRAPH_CHUNKS = 5
    MAX_SUB_QUERIES = 4

    def __init__(
        self,
        chat_service: Optional[ChatService] = None,
        search_service: Optional[SearchService] = None,
        graph_service: Optional[GraphService] = None,
        resolver: Optional[EffectiveResolver] = None,
        conflict_detector: Optional[ConflictDetector] = None,
    ):
        self.chat_service = chat_service or ChatService()
        self.search_service = search_service or SearchService(
            chat_service=self.chat_service
        )
        self.graph_service = graph_service or GraphService(
            self.search_service.database_file
        )
        self.graph_service.load_graph()
        self.resolver = resolver or EffectiveResolver(self.search_service.database_file)
        self.conflict_detector = conflict_detector or ConflictDetector(
            self.search_service.database_file
        )
        self.citation_guard = CitationGuard()

    def process(
        self,
        messages: list[dict[str, str]],
        stream: bool = True,
        model: Optional[str] = None,
        as_of: Optional[str] = None,
    ) -> Generator[dict[str, Any], None, None]:
        conversation = [
            message
            for message in messages
            if message.get("role") in {"user", "assistant"} and message.get("content")
        ]
        if not conversation:
            yield self._error("Không có nội dung hội thoại hợp lệ.")
            return
        try:
            resolved_date = self.resolver.normalize_as_of(as_of)
        except ValueError:
            yield self._error("as_of phải có định dạng YYYY-MM-DD.")
            return

        question = self._last_user_question(conversation)
        if not question:
            yield self._error("Không tìm thấy câu hỏi của người dùng.")
            return

        yield {"step": "sub_queries", "status": "processing", "data": None}
        generated_queries = self._generate_sub_queries(conversation, question, model)
        sub_queries = self._ensure_original_question(question, generated_queries)
        yield {
            "step": "sub_queries",
            "status": "done",
            "data": {"queries": sub_queries},
        }

        yield {"step": "retrieval", "status": "processing", "data": None}
        search_outputs = self._run_searches(sub_queries, resolved_date)
        retrieved = self._deduplicate(
            [item for output in search_outputs for item in output["results"]]
        )[: self.MAX_DIRECT_CHUNKS]
        excluded = [item for output in search_outputs for item in output["excluded"]]
        retrieval_trace = [output["trace"] for output in search_outputs]
        yield {
            "step": "retrieval",
            "status": "done",
            "data": {
                "count": len(retrieved),
                "excluded_count": len(excluded),
                "as_of": resolved_date,
                "trace": retrieval_trace,
            },
        }

        yield {
            "step": "temporal_resolution",
            "status": "done",
            "data": {
                "as_of": resolved_date,
                "included_count": len(retrieved),
                "excluded_count": len(excluded),
                "excluded": [self._trace_item(item) for item in excluded],
            },
        }

        yield {"step": "graph_expansion", "status": "processing", "data": None}
        graph_additions, graph_trace = self.graph_service.expand_evidence(
            retrieved,
            as_of=resolved_date,
            max_hops=1,
            node_budget=self.MAX_GRAPH_CHUNKS,
        )
        context_docs = self._deduplicate([*retrieved, *graph_additions])[
            : self.MAX_CONTEXT_CHUNKS
        ]
        context_docs, final_excluded = self.resolver.resolve_documents(
            context_docs, resolved_date
        )
        excluded.extend(final_excluded)
        yield {
            "step": "graph_expansion",
            "status": "done",
            "data": {
                "added_count": len(graph_additions),
                "trace": graph_trace,
            },
        }

        citation_map = {
            str(index + 1): document for index, document in enumerate(context_docs)
        }
        yield {
            "step": "context_ready",
            "status": "done",
            "data": {
                "citations": citation_map,
                "sources": context_docs,
                "as_of": resolved_date,
                "temporal_trace": {
                    "included": [self._trace_item(item) for item in context_docs],
                    "excluded": [self._trace_item(item) for item in excluded],
                },
                "graph_trace": graph_trace,
            },
        }

        if not context_docs:
            yield {"step": "answer", "status": "start", "data": None}
            yield {
                "step": "answer",
                "status": "done",
                "data": {
                    "text": CitationGuard.ABSTENTION,
                    "citations": {},
                    "sources": [],
                    "citation_warnings": [
                        "Không có bằng chứng đang hiệu lực tại thời điểm truy vấn."
                    ],
                    "conflicts": [],
                    "conflict_status": "insufficient_evidence",
                    "as_of": resolved_date,
                    "temporal_trace": {
                        "included": [],
                        "excluded": [self._trace_item(item) for item in excluded],
                    },
                    "graph_trace": graph_trace,
                    "retrieval_trace": retrieval_trace,
                },
            }
            return

        conflicts = self.conflict_detector.detect_conflicts(
            context_docs, model=model, as_of=resolved_date
        )
        conflict_status = self.conflict_detector.last_status
        temporal_decision = self._temporal_decision(question, context_docs, excluded)
        llm_messages = self._generation_messages(
            conversation,
            context_docs,
            conflicts,
            resolved_date,
            temporal_decision,
        )

        yield {"step": "answer", "status": "start", "data": None}
        full_answer = ""
        try:
            for piece in self._generate_answer(llm_messages, stream, model):
                full_answer += piece
                yield {
                    "step": "answer",
                    "status": "streaming",
                    "data": {"chunk": piece, "citations": citation_map},
                }
        except Exception as error:
            yield self._error(str(error))
            return

        full_answer = self._enforce_temporal_decision(full_answer, temporal_decision)
        full_answer, used_citations, warnings = self.citation_guard.validate(
            full_answer, citation_map
        )
        yield {
            "step": "answer",
            "status": "done",
            "data": {
                "text": full_answer,
                "citations": used_citations,
                "sources": context_docs,
                "citation_warnings": warnings,
                "conflicts": conflicts,
                "conflict_status": conflict_status,
                "as_of": resolved_date,
                "temporal_trace": {
                    "included": [self._trace_item(item) for item in context_docs],
                    "excluded": [self._trace_item(item) for item in excluded],
                },
                "graph_trace": graph_trace,
                "retrieval_trace": retrieval_trace,
                "temporal_decision": temporal_decision,
            },
        }

    def _generate_sub_queries(
        self,
        conversation: list[dict[str, str]],
        question: str,
        model: Optional[str],
    ) -> list[str]:
        history = "\n".join(
            f"{message['role']}: {message['content']}" for message in conversation
        )
        prompt = (
            "Tạo tối đa 3 truy vấn tìm kiếm độc lập cho câu hỏi pháp lý cuối cùng. "
            "Giữ nguyên số hiệu văn bản, Điều, Khoản, mốc thời gian và chủ thể. "
            "Trả JSON thuần có dạng {\"queries\": [\"...\"]}.\n\n"
            f"Hội thoại:\n{history}\n\nCâu hỏi cuối: {question}"
        )
        try:
            content = ""
            for message in self.chat_service.generate_response(
                [
                    {
                        "role": "system",
                        "content": "Bạn tối ưu truy vấn cho kho văn bản pháp lý Việt Nam.",
                    },
                    {"role": "user", "content": prompt + " /no_think"},
                ],
                response_format=SUB_QUERY_SCHEMA,
                stream=False,
                model=model,
            ):
                if isinstance(message, dict) and message.get("error"):
                    raise RuntimeError(message["error"])
                content = getattr(message, "content", "") or ""
            match = re.search(r"\{.*\}", content, re.DOTALL)
            payload = json.loads(match.group(0) if match else content)
            return [
                item.strip()
                for item in payload.get("queries", [])
                if isinstance(item, str) and item.strip()
            ][:3]
        except Exception as error:
            print(f"Không thể tách sub-query, dùng câu hỏi gốc: {error}")
            return []

    def _run_searches(self, queries: list[str], as_of: str) -> list[dict[str, Any]]:
        def run(query: str) -> dict[str, Any]:
            return self.search_service.search(query, top_k=5, as_of=as_of)

        with concurrent.futures.ThreadPoolExecutor(
            max_workers=min(len(queries), self.MAX_SUB_QUERIES)
        ) as executor:
            return list(executor.map(run, queries))

    def _generation_messages(
        self,
        conversation: list[dict[str, str]],
        context_docs: list[dict[str, Any]],
        conflicts: list[dict[str, Any]],
        as_of: str,
        temporal_decision: Optional[dict[str, Any]],
    ) -> list[dict[str, str]]:
        context = []
        chunk_to_citation = {}
        for index, document in enumerate(context_docs, start=1):
            chunk_to_citation[document["chunk_id"]] = str(index)
            metadata = document.get("metadata", {})
            provenance = (
                "scenario_synthetic"
                if metadata.get("is_synthetic")
                else "official_text_snapshot_machine_normalized"
            )
            context.append(
                f"[{index}] {metadata.get('doc_num')} · {metadata.get('article')} · "
                f"{metadata.get('clause') or 'Toàn điều'} · valid_from "
                f"{metadata.get('valid_from') or metadata.get('effective_date')} · "
                f"valid_to {metadata.get('valid_to') or 'open'} · trạng thái tại {as_of}: "
                f"{document.get('temporal_status', 'effective')} · provenance: {provenance}\n"
                f"{document.get('content', '')}"
            )
        conflict_hints = []
        for conflict in conflicts:
            law_key = chunk_to_citation.get(conflict["law_chunk_id"])
            policy_key = chunk_to_citation.get(conflict["policy_chunk_id"])
            if law_key and policy_key:
                conflict_hints.append(
                    f"- Xung đột tiềm ẩn đã duyệt giữa [{policy_key}] và [{law_key}]: "
                    f"{conflict['description']}"
                )
        conflict_text = "\n".join(conflict_hints) or "- Không có quan hệ xung đột đã duyệt trong evidence pack."
        temporal_text = (
            f"{temporal_decision['answer']} — {temporal_decision['reason']}"
            if temporal_decision
            else "Không áp dụng cho câu hỏi này."
        )
        system = (
            "Bạn là trợ lý hỗ trợ tra cứu tuân thủ. Chỉ sử dụng evidence pack dưới đây. "
            "Mọi kết luận pháp lý, ngày, số tiền và giới hạn phải có trích dẫn dạng [1] hoặc [2] ngay trên cùng dòng. "
            "Chỉ dùng số citation thực có trong evidence pack; tuyệt đối không viết placeholder chữ như ngoặc vuông N. "
            "Không được tạo số hiệu, điều khoản hoặc nguồn mới. Nếu bằng chứng không đủ, phải nói không đủ dữ liệu. "
            "Phân biệt đúng provenance trong từng evidence: scenario_synthetic là dữ liệu kịch bản mô phỏng; "
            "official_text_snapshot_machine_normalized là bản chụp nguồn pháp luật được chuẩn hóa máy và vẫn phải đối chiếu bản chính thức hiện hành. "
            "Không gọi nguồn thứ hai là dữ liệu mô phỏng. Mọi kết quả đều không phải tư vấn pháp lý. "
            "Nếu có KẾT LUẬN HIỆU LỰC XÁC ĐỊNH bên dưới, phải mở đầu bằng đúng từ CÓ hoặc KHÔNG đã cho; không được đảo dấu phủ định. "
            f"Ngày đối chiếu hiệu lực: {as_of}.\n\nEVIDENCE PACK:\n"
            + "\n\n".join(context)
            + "\n\nKẾT LUẬN HIỆU LỰC XÁC ĐỊNH:\n"
            + temporal_text
            + "\n\nQUAN HỆ XUNG ĐỘT ĐÃ DUYỆT:\n"
            + conflict_text
        )
        return [{"role": "system", "content": system}, *conversation]

    @staticmethod
    def _temporal_decision(
        question: str,
        included: list[dict[str, Any]],
        excluded: list[dict[str, Any]],
    ) -> Optional[dict[str, Any]]:
        if "hiệu lực" not in question.lower():
            return None
        exact_excluded = [item for item in excluded if item.get("exact_match")]
        if exact_excluded:
            item = exact_excluded[0]
            return {
                "answer": "KHÔNG",
                "chunk_id": item.get("chunk_id"),
                "state": item.get("temporal_status"),
                "reason": item.get("temporal_reason") or "Điều khoản không hiệu lực tại ngày đối chiếu.",
            }
        exact_included = [item for item in included if item.get("exact_match")]
        if exact_included:
            item = exact_included[0]
            return {
                "answer": "CÓ",
                "chunk_id": item.get("chunk_id"),
                "state": item.get("temporal_status", "effective"),
                "reason": item.get("temporal_reason") or "Điều khoản có hiệu lực tại ngày đối chiếu.",
            }
        return None

    @staticmethod
    def _enforce_temporal_decision(
        answer: str, decision: Optional[dict[str, Any]]
    ) -> str:
        text = (answer or "").strip()
        if not decision:
            return text
        expected = decision["answer"].upper()
        match = re.match(r"^(CÓ|KHÔNG)\b[\s,:.-]*", text, re.IGNORECASE)
        if match:
            remainder = text[match.end() :].lstrip()
            return expected + (f". {remainder}" if remainder else ".")
        return f"{expected}. {text}"

    def _generate_answer(
        self,
        messages: list[dict[str, str]],
        stream: bool,
        model: Optional[str],
    ) -> Generator[str, None, None]:
        for response in self.chat_service.generate_response(
            messages, stream=stream, model=model
        ):
            if isinstance(response, dict) and response.get("error"):
                raise RuntimeError(response["error"])
            if stream:
                if not getattr(response, "choices", None):
                    continue
                piece = getattr(response.choices[0].delta, "content", None)
            else:
                piece = getattr(response, "content", None)
            if piece:
                yield piece

    @staticmethod
    def _ensure_original_question(question: str, generated: list[str]) -> list[str]:
        result = [question]
        seen = {re.sub(r"\s+", " ", question.strip().lower())}
        for item in generated:
            normalized = re.sub(r"\s+", " ", item.strip().lower())
            if normalized not in seen:
                result.append(item)
                seen.add(normalized)
            if len(result) == RAGPipeline.MAX_SUB_QUERIES:
                break
        return result

    @staticmethod
    def _deduplicate(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen = set()
        result = []
        for document in documents:
            chunk_id = document.get("chunk_id")
            if not chunk_id or chunk_id in seen:
                continue
            seen.add(chunk_id)
            result.append(document)
        return result

    @staticmethod
    def _last_user_question(messages: list[dict[str, str]]) -> str:
        for message in reversed(messages):
            if message.get("role") == "user":
                return message.get("content", "")
        return ""

    @staticmethod
    def _trace_item(document: dict[str, Any]) -> dict[str, Any]:
        metadata = document.get("metadata", {})
        return {
            "chunk_id": document.get("chunk_id"),
            "doc_num": metadata.get("doc_num"),
            "article": metadata.get("article"),
            "clause": metadata.get("clause"),
            "state": document.get("temporal_status", "effective"),
            "reason": document.get("temporal_reason", ""),
            "replacement_path": document.get("replacement_path", []),
        }

    @staticmethod
    def _error(message: str) -> dict[str, Any]:
        return {"step": "answer", "status": "error", "data": {"error": message}}
