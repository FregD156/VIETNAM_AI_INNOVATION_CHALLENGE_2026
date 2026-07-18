from __future__ import annotations

import re
import sqlite3
from contextlib import closing
from typing import Any, Optional

import faiss
import numpy as np
from rank_bm25 import BM25Okapi

from app.core.paths import FAISS_INDEX_FILE, SQLITE_DATABASE_FILE
from app.integrations.llm_client import ChatService
from app.rag.effective_resolver import EffectiveResolver


class SearchService:
    DOMAIN_TERMS = {
        "ngân hàng",
        "tổ chức tín dụng",
        "khách hàng",
        "tài khoản",
        "giao dịch",
        "chuyển tiền",
        "thanh toán",
        "cho vay",
        "khoản vay",
        "tín dụng",
        "lãi suất",
        "hạn mức",
        "nợ quá hạn",
        "tài sản bảo đảm",
        "rửa tiền",
        "ekyc",
        "lending",
        "shb-",
        "định danh",
        "sinh trắc học",
        "chữ ký điện tử",
        "chữ ký số",
        "thông điệp dữ liệu",
        "hợp đồng điện tử",
        "tuân thủ",
        "thông tư",
        "ngân hàng nhà nước",
    }
    LEXICAL_STOPWORDS = {
        "có",
        "cho",
        "của",
        "là",
        "nào",
        "quy",
        "định",
        "theo",
        "trong",
        "và",
        "về",
        "được",
        "không",
    }
    def __init__(
        self,
        threshold: float = 0.5,
        database_file: Optional[str] = None,
        faiss_file: Optional[str] = None,
        chat_service: Optional[ChatService] = None,
    ):
        self.threshold = threshold
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)
        self.faiss_file = faiss_file or str(FAISS_INDEX_FILE)
        self.chat_service = chat_service or ChatService()
        self.resolver = EffectiveResolver(self.database_file)
        self.index = faiss.read_index(self.faiss_file)
        self.faiss_id_map: dict[int, str] = {}
        self.chunk_map: dict[str, dict[str, Any]] = {}
        self.chunks_text_map: dict[str, str] = {}
        self.article_index_map: dict[str, list[str]] = {}
        self._load_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_file)
        connection.row_factory = sqlite3.Row
        return connection

    def _load_database(self) -> None:
        with closing(self._connect()) as connection:
            rows = connection.execute(
                """
                SELECT c.chunk_id, c.article, c.clause, c.point, c.embed_text,
                       c.faiss_index, c.provision_id, c.version_id,
                       c.valid_from, c.valid_to, c.reviewed, c.review_level,
                       d.doc_id, d.doc_num, d.title, d.effective_date,
                       d.expiration_date, d.status, d.source_type, d.source_url,
                       d.is_synthetic, d.version,
                       d.review_level AS document_review_level
                FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
                ORDER BY c.faiss_index
                """
            ).fetchall()
        for row in rows:
            data = dict(row)
            chunk_id = data.pop("chunk_id")
            content = data.pop("embed_text") or ""
            faiss_index = data.pop("faiss_index")
            self.chunk_map[chunk_id] = data
            self.chunks_text_map[chunk_id] = content
            if faiss_index is not None:
                self.faiss_id_map[int(faiss_index)] = chunk_id
            article_key = f"{data['doc_id']}|{data.get('article') or ''}"
            self.article_index_map.setdefault(article_key, []).append(chunk_id)

        self.bm25_chunks = list(self.chunk_map)
        corpus = [self._tokenize(self.chunks_text_map[item]) for item in self.bm25_chunks]
        self.bm25 = BM25Okapi(corpus)

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"\w+", (text or "").lower(), re.UNICODE)

    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", (text or "").strip().lower())

    def search(
        self,
        query: str,
        top_k: int = 20,
        include_superseded: bool = False,
        as_of: Optional[str] = None,
    ) -> dict[str, Any]:
        requested = max(1, top_k)
        candidate_limit = min(max(requested * 4, 20), len(self.chunk_map))
        requested_doc_num = self._extract_doc_num(query)
        if requested_doc_num and not any(
            self._normalize(metadata.get("doc_num", ""))
            == self._normalize(requested_doc_num)
            for metadata in self.chunk_map.values()
        ):
            return {
                "results": [],
                "excluded": [],
                "trace": {
                    "query": query,
                    "exact_candidates": 0,
                    "vector_candidates": 0,
                    "bm25_candidates": 0,
                    "fused_candidates": 0,
                    "excluded_count": 0,
                    "as_of": self.resolver.normalize_as_of(as_of),
                    "unknown_identifier": requested_doc_num,
                },
            }
        if not requested_doc_num and not self._is_in_domain_query(query):
            return {
                "results": [],
                "excluded": [],
                "trace": {
                    "query": query,
                    "exact_candidates": 0,
                    "vector_candidates": 0,
                    "bm25_candidates": 0,
                    "fused_candidates": 0,
                    "excluded_count": 0,
                    "as_of": self.resolver.normalize_as_of(as_of),
                    "out_of_domain": True,
                },
            }
        exact_results = self._exact_identifier_candidates(query)

        vector_results: list[str] = []
        vector_scores: dict[str, float] = {}
        vector = self.chat_service.get_embedding(query)
        if vector and len(vector) == self.index.d:
            values = np.asarray([vector], dtype=np.float32)
            scores, identifiers = self.index.search(values, candidate_limit)
            for score, identifier in zip(scores[0], identifiers[0]):
                chunk_id = self.faiss_id_map.get(int(identifier))
                if chunk_id:
                    vector_results.append(chunk_id)
                    vector_scores[chunk_id] = float(score)

        bm25_scores_array = self.bm25.get_scores(self._tokenize(query))
        bm25_order = np.argsort(bm25_scores_array)[::-1][:candidate_limit]
        bm25_results = [
            self.bm25_chunks[index]
            for index in bm25_order
            if float(bm25_scores_array[index]) > 0
        ]
        bm25_scores = {
            self.bm25_chunks[index]: float(bm25_scores_array[index])
            for index in bm25_order
            if float(bm25_scores_array[index]) > 0
        }

        rrf_scores: dict[str, float] = {}
        for results, weight in (
            (exact_results, 2.0),
            (vector_results, 1.0),
            (bm25_results, 1.0),
        ):
            for rank, chunk_id in enumerate(results):
                rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + weight / (
                    60 + rank + 1
                )
        ranked_ids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)

        raw_candidates = []
        for chunk_id in ranked_ids:
            exact_match = chunk_id in exact_results
            vector_score = vector_scores.get(chunk_id)
            overlap_count, lexical_coverage = self._lexical_relevance(
                query, self.chunks_text_map.get(chunk_id, "")
            )
            vector_relevant = vector_score is not None and vector_score >= self.threshold
            # A large legal corpus contains generic words such as "tài sản" and
            # "khai thác" in unrelated contexts.  Requiring broad query-token
            # coverage prevents those coincidental overlaps from turning an
            # out-of-domain question into legal evidence.
            lexical_relevant = overlap_count >= 2 and lexical_coverage >= 0.60
            if not (exact_match or vector_relevant or lexical_relevant):
                continue
            item = self._result(
                chunk_id,
                rrf_score=rrf_scores[chunk_id],
                vector_score=vector_score,
                bm25_score=bm25_scores.get(chunk_id),
                exact_match=exact_match,
            )
            item["lexical_overlap"] = overlap_count
            item["lexical_coverage"] = lexical_coverage
            raw_candidates.append(item)
        if include_superseded:
            included, excluded = raw_candidates, []
        else:
            included, excluded = self.resolver.resolve_documents(raw_candidates, as_of)
            replacement_candidates = []
            for item in excluded:
                replacement_candidates.extend(
                    (item.get("chunk_id"), chunk_id)
                    for chunk_id in item.get("replacement_path", [])[1:]
                )
            for replaced_chunk_id, chunk_id in replacement_candidates:
                if chunk_id not in self.chunk_map or any(
                    item["chunk_id"] == chunk_id for item in included
                ):
                    continue
                replacement = self.get_chunk(chunk_id)
                replacement["retrieval_origin"] = "temporal_replacement"
                replacement["relation_type"] = "superseded_by"
                replacement["relation_path"] = [replaced_chunk_id, chunk_id]
                resolved_replacements, _ = self.resolver.resolve_documents(
                    [replacement], as_of
                )
                included.extend(resolved_replacements)

        candidates = included[: max(requested * 2, requested)]
        rerank_scores = self.chat_service.get_rerank_scores(
            query, [candidate["content"] for candidate in candidates]
        )
        for index, candidate in enumerate(candidates):
            candidate["rerank_score"] = (
                float(rerank_scores[index]) if index < len(rerank_scores) else 0.0
            )
        candidates.sort(
            key=lambda item: (item["rerank_score"], item["rrf_score"]),
            reverse=True,
        )
        return {
            "results": candidates[:requested],
            "excluded": excluded,
            "trace": {
                "query": query,
                "exact_candidates": len(exact_results),
                "vector_candidates": len(vector_results),
                "bm25_candidates": len(bm25_results),
                "fused_candidates": len(ranked_ids),
                "excluded_count": len(excluded),
                "as_of": self.resolver.normalize_as_of(as_of),
            },
        }

    def semantic_search(
        self,
        query: str,
        top_k: int = 20,
        include_superseded: bool = False,
        as_of: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        return self.search(query, top_k, include_superseded, as_of)["results"]

    def doc_ref_search(
        self,
        query: str,
        doc_ref: str,
        article_filter: Optional[str] = None,
        clause_filter: Optional[str] = None,
        top_k: int = 10,
        include_superseded: bool = False,
        as_of: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        ref = self._normalize(self._extract_doc_num(doc_ref) or doc_ref)
        matched = []
        for chunk_id, metadata in self.chunk_map.items():
            doc_num = self._normalize(metadata.get("doc_num", ""))
            title = self._normalize(metadata.get("title", ""))
            if ref not in {doc_num, title} and ref not in doc_num and ref not in title:
                continue
            if article_filter and self._normalize(article_filter) not in self._normalize(
                metadata.get("article", "")
            ):
                continue
            if clause_filter and self._normalize(clause_filter) not in self._normalize(
                metadata.get("clause", "")
            ):
                continue
            matched.append(
                self._result(
                    chunk_id,
                    rrf_score=1.0,
                    vector_score=None,
                    bm25_score=None,
                    exact_match=True,
                    retrieval_origin="document_reference",
                )
            )
        if not include_superseded:
            matched, _ = self.resolver.resolve_documents(matched, as_of)
        if len(matched) <= top_k:
            return matched
        query_tokens = set(self._tokenize(query))
        matched.sort(
            key=lambda item: len(query_tokens & set(self._tokenize(item["content"]))),
            reverse=True,
        )
        return matched[:top_k]

    def get_chunk(self, chunk_id: str) -> Optional[dict[str, Any]]:
        if chunk_id not in self.chunk_map:
            return None
        return self._result(
            chunk_id,
            rrf_score=0.0,
            vector_score=None,
            bm25_score=None,
            exact_match=True,
            retrieval_origin="graph",
        )

    def _exact_identifier_candidates(self, query: str) -> list[str]:
        normalized = self._normalize(query)
        doc_matches = [
            doc_num
            for doc_num in {item.get("doc_num", "") for item in self.chunk_map.values()}
            if doc_num and self._normalize(doc_num) in normalized
        ]
        article_match = re.search(r"\bđiều\s+([\w.-]+)", normalized, re.UNICODE)
        clause_match = re.search(r"\bkhoản\s+([\w.-]+)", normalized, re.UNICODE)
        results = []
        for chunk_id, metadata in self.chunk_map.items():
            if doc_matches and metadata.get("doc_num") not in doc_matches:
                continue
            if article_match and self._normalize(metadata.get("article", "")) != self._normalize(
                f"Điều {article_match.group(1)}"
            ):
                continue
            if clause_match and self._normalize(metadata.get("clause", "")) != self._normalize(
                f"Khoản {clause_match.group(1)}"
            ):
                continue
            if doc_matches or article_match or clause_match:
                results.append(chunk_id)
        return results

    def _lexical_relevance(self, query: str, content: str) -> tuple[int, float]:
        query_tokens = {
            token
            for token in self._tokenize(query)
            if token not in self.LEXICAL_STOPWORDS and len(token) > 1
        }
        if not query_tokens:
            return 0, 0.0
        content_tokens = set(self._tokenize(content))
        overlap = len(query_tokens & content_tokens)
        return overlap, overlap / len(query_tokens)

    @classmethod
    def _is_in_domain_query(cls, query: str) -> bool:
        normalized = cls._normalize(query)
        return any(term in normalized for term in cls.DOMAIN_TERMS)

    def _result(
        self,
        chunk_id: str,
        *,
        rrf_score: float,
        vector_score: Optional[float],
        bm25_score: Optional[float],
        exact_match: bool,
        retrieval_origin: str = "hybrid",
    ) -> dict[str, Any]:
        return {
            "chunk_id": chunk_id,
            "content": self.chunks_text_map.get(chunk_id, ""),
            "metadata": dict(self.chunk_map.get(chunk_id, {})),
            "score": rrf_score,
            "rrf_score": rrf_score,
            "vector_score": vector_score,
            "bm25_score": bm25_score,
            "exact_match": exact_match,
            "retrieval_origin": retrieval_origin,
        }

    @staticmethod
    def _extract_doc_num(text: str) -> Optional[str]:
        match = re.search(
            r"\d+[A-Za-z]*\s*/\s*\d{4}\s*/\s*[A-ZĐƯƠ][A-Z0-9ĐƯƠ]*(?:-[A-Z0-9ĐƯƠ]+)*",
            text or "",
            flags=re.UNICODE,
        )
        if not match:
            return None
        return re.sub(r"\s*/\s*", "/", match.group(0)).strip()
