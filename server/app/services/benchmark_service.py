from __future__ import annotations

import json
import sqlite3
import time
from contextlib import closing
from pathlib import Path
from typing import Any, Union, Optional

from rank_bm25 import BM25Okapi

from app.core.paths import FAISS_INDEX_FILE, SQLITE_DATABASE_FILE
from app.rag.conflict_detector import ConflictDetector
from app.rag.effective_resolver import EffectiveResolver
from app.rag.knowledge_graph import GraphService
from app.rag.retrieval import SearchService


GOLD_CASES_FILE = Path(__file__).resolve().parents[2] / "evaluation" / "gold_cases.json"


class _OfflineChatService:
    """Keeps the benchmark deterministic and free of external API calls."""

    @staticmethod
    def get_embedding(text: str) -> list[float]:
        del text
        return []

    @staticmethod
    def get_rerank_scores(query: str, documents: list[str]) -> list[float]:
        del query
        return [1.0] * len(documents)


class BenchmarkService:
    def __init__(
        self,
        database_file: Optional[str] = None,
        faiss_file: Optional[str] = None,
        gold_cases_file: Optional[str] = None,
    ):
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)
        self.faiss_file = faiss_file or str(FAISS_INDEX_FILE)
        self.gold_cases_file = Path(gold_cases_file or GOLD_CASES_FILE)

    def run(self, top_k: int = 5) -> dict[str, Any]:
        cases = json.loads(self.gold_cases_file.read_text(encoding="utf-8"))
        chunks = self._load_chunks()
        bm25 = BM25Okapi(
            [SearchService._tokenize(chunk["content"]) for chunk in chunks]
        )
        resolver = EffectiveResolver(self.database_file)
        graph = GraphService(self.database_file)
        graph.load_graph()
        advanced_search = SearchService(
            database_file=self.database_file,
            faiss_file=self.faiss_file,
            chat_service=_OfflineChatService(),
        )
        detector = ConflictDetector(self.database_file)

        case_results = []
        standard_latencies = []
        advanced_latencies = []
        for case in cases:
            started = time.perf_counter()
            standard_ids = self._standard_search(case["query"], chunks, bm25, top_k)
            standard_latencies.append((time.perf_counter() - started) * 1000)

            started = time.perf_counter()
            direct_budget = max(1, top_k - 2)
            search_output = advanced_search.search(
                case["query"], top_k=direct_budget, as_of=case["as_of"]
            )
            direct = search_output["results"]
            additions, graph_trace = graph.expand_evidence(
                direct,
                as_of=case["as_of"],
                max_hops=1,
                node_budget=top_k - len(direct),
            )
            advanced_docs = self._deduplicate([*direct, *additions])[:top_k]
            advanced_ids = [item["chunk_id"] for item in advanced_docs]
            detector.detect_conflicts(advanced_docs, as_of=case["as_of"])
            conflict_status = detector.last_status
            advanced_latencies.append((time.perf_counter() - started) * 1000)

            standard_eval = self._evaluate(
                standard_ids,
                case,
                resolver,
                graph_trace=[],
                conflict_status="not_evaluated",
            )
            advanced_eval = self._evaluate(
                advanced_ids,
                case,
                resolver,
                graph_trace=graph_trace,
                conflict_status=conflict_status,
            )
            case_results.append(
                {
                    "id": case["id"],
                    "category": case["category"],
                    "query": case["query"],
                    "as_of": case["as_of"],
                    "expected_chunks": case.get("expected_chunks", []),
                    "forbidden_chunks": case.get("forbidden_chunks", []),
                    "standard": {"chunk_ids": standard_ids, **standard_eval},
                    "advanced": {
                        "chunk_ids": advanced_ids,
                        "graph_trace": graph_trace,
                        **advanced_eval,
                    },
                }
            )

        standard_metrics = self._aggregate(
            case_results, "standard", standard_latencies
        )
        advanced_metrics = self._aggregate(
            case_results, "advanced", advanced_latencies
        )
        return {
            "methodology": (
                "Benchmark offline trên gold set được duyệt. Standard dùng BM25 top-5, "
                "không lọc hiệu lực/graph/conflict; Advanced dùng exact + BM25/RRF, "
                "EffectiveResolver, graph expansion và conflict relations. Vector bị tắt "
                "trong cả hai nhánh để không gọi API ngoài."
            ),
            "gold_cases": len(cases),
            "top_k": top_k,
            "cases": case_results,
            "metrics": {
                "standard": standard_metrics,
                "advanced": advanced_metrics,
                "delta": {
                    key: advanced_metrics[key] - standard_metrics[key]
                    for key in (
                        "recall_at_5",
                        "mrr",
                        "current_version_accuracy",
                        "reference_resolution_rate",
                        "citation_validity_rate",
                        "conflict_success_rate",
                        "abstention_accuracy",
                    )
                },
            },
        }

    def _load_chunks(self) -> list[dict[str, Any]]:
        with closing(sqlite3.connect(self.database_file)) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT c.chunk_id, c.embed_text AS content
                FROM chunks c ORDER BY c.faiss_index
                """
            ).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def _standard_search(
        query: str,
        chunks: list[dict[str, Any]],
        bm25: BM25Okapi,
        top_k: int,
    ) -> list[str]:
        scores = bm25.get_scores(SearchService._tokenize(query))
        ranked = sorted(range(len(chunks)), key=lambda index: scores[index], reverse=True)
        return [chunks[index]["chunk_id"] for index in ranked[:top_k]]

    @staticmethod
    def _deduplicate(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
        result = []
        seen = set()
        for document in documents:
            if document["chunk_id"] in seen:
                continue
            seen.add(document["chunk_id"])
            result.append(document)
        return result

    @staticmethod
    def _evaluate(
        chunk_ids: list[str],
        case: dict[str, Any],
        resolver: EffectiveResolver,
        graph_trace: list[dict[str, Any]],
        conflict_status: str,
    ) -> dict[str, Any]:
        expected = set(case.get("expected_chunks", []))
        forbidden = set(case.get("forbidden_chunks", []))
        hits = expected & set(chunk_ids)
        recall = len(hits) / len(expected) if expected else None
        reciprocal_rank = 0.0
        for rank, chunk_id in enumerate(chunk_ids, start=1):
            if chunk_id in expected:
                reciprocal_rank = 1 / rank
                break
        active_count = sum(
            resolver.resolve(chunk_id, case["as_of"])["is_effective"]
            for chunk_id in chunk_ids
        )
        reference_target = case.get("required_graph_target")
        reference_resolved = None
        if reference_target:
            reference_resolved = reference_target in chunk_ids and any(
                item.get("to") == reference_target and item.get("included")
                for item in graph_trace
            )
        expected_conflict = case.get("expected_conflict")
        conflict_success = None
        if expected_conflict is not None:
            conflict_success = (conflict_status == "detected") == expected_conflict
        should_abstain = case.get("should_abstain")
        abstention_success = None
        if should_abstain is not None:
            abstention_success = (len(chunk_ids) == 0) == should_abstain
        return {
            "recall": recall,
            "reciprocal_rank": reciprocal_rank,
            "hit": bool(hits) if expected else len(chunk_ids) == 0,
            "forbidden_returned": sorted(forbidden & set(chunk_ids)),
            "stale_count": len(forbidden & set(chunk_ids)),
            "citation_validity": active_count / len(chunk_ids) if chunk_ids else 1.0,
            "current_version_correct": (
                expected <= set(chunk_ids) and not (forbidden & set(chunk_ids))
                if case["category"] == "temporal"
                else None
            ),
            "reference_resolved": reference_resolved,
            "conflict_success": conflict_success,
            "abstention_success": abstention_success,
        }

    @staticmethod
    def _aggregate(
        results: list[dict[str, Any]], method: str, latencies: list[float]
    ) -> dict[str, float]:
        evaluations = [result[method] for result in results]

        def average(values: Optional[Union[list[float, bool]]]) -> float:
            filtered = [float(value) for value in values if value is not None]
            return sum(filtered) / len(filtered) if filtered else 0.0

        stale_cases = sum(item["stale_count"] > 0 for item in evaluations)
        return {
            "recall_at_5": average([item["recall"] for item in evaluations]),
            "mrr": average(
                [
                    item["reciprocal_rank"]
                    for item in evaluations
                    if item["recall"] is not None
                ]
            ),
            "current_version_accuracy": average(
                [item["current_version_correct"] for item in evaluations]
            ),
            "stale_leakage_rate": stale_cases / len(evaluations),
            "reference_resolution_rate": average(
                [item["reference_resolved"] for item in evaluations]
            ),
            "citation_validity_rate": average(
                [item["citation_validity"] for item in evaluations]
            ),
            "conflict_success_rate": average(
                [item["conflict_success"] for item in evaluations]
            ),
            "abstention_accuracy": average(
                [item["abstention_success"] for item in evaluations]
            ),
            "mean_latency_ms": sum(latencies) / len(latencies),
        }
