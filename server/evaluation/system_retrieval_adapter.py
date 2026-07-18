"""Run one repository's actual Advanced retrieval path without external APIs.

The adapter is executed in a separate process so the two repositories can each
import their own ``app`` package without module collisions.  Embedding and
reranking calls are disabled for determinism; all other retrieval, temporal and
server-side graph behavior comes from the selected repository.
"""

from __future__ import annotations

import argparse
import contextlib
import json
import sys
import time
from pathlib import Path


class OfflineChatService:
    @staticmethod
    def get_embedding(text: str) -> list[float]:
        del text
        return []

    @staticmethod
    def get_rerank_scores(query: str, documents: list[str]) -> list[float]:
        del query
        return [1.0] * len(documents)


def _deduplicate(documents: list[dict], top_k: int) -> list[dict]:
    result = []
    seen = set()
    for document in documents:
        chunk_id = document.get("chunk_id")
        if not chunk_id or chunk_id in seen:
            continue
        seen.add(chunk_id)
        result.append(document)
        if len(result) == top_k:
            break
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--cases", type=Path, required=True)
    parser.add_argument("--mode", choices=("original", "upgraded"), required=True)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    repo = args.repo.resolve()
    sys.path.insert(0, str(repo / "backend"))
    cases = json.loads(args.cases.read_text(encoding="utf-8"))

    # The original implementation logs index initialization to stdout.  Keep
    # stdout machine-readable and forward diagnostics to stderr.
    with contextlib.redirect_stdout(sys.stderr):
        from app.rag.retrieval import SearchService

        if args.mode == "original":
            search = SearchService()
            search.chat_service = OfflineChatService()
            graph = None
        else:
            from app.rag.knowledge_graph import GraphService

            search = SearchService(chat_service=OfflineChatService())
            graph = GraphService()
            graph.load_graph()

    results = []
    for case in cases:
        started = time.perf_counter()
        with contextlib.redirect_stdout(sys.stderr):
            if args.mode == "original":
                documents = search.semantic_search(
                    case["query"],
                    top_k=args.top_k,
                    include_superseded=False,
                )
                graph_trace = []
            else:
                direct_budget = max(1, args.top_k - 2)
                output = search.search(
                    case["query"],
                    top_k=direct_budget,
                    include_superseded=False,
                    as_of=case["as_of"],
                )
                direct = output["results"]
                additions, graph_trace = graph.expand_evidence(
                    direct,
                    as_of=case["as_of"],
                    max_hops=1,
                    node_budget=args.top_k - len(direct),
                )
                documents = _deduplicate([*direct, *additions], args.top_k)
        results.append(
            {
                "id": case["id"],
                "chunk_ids": [item["chunk_id"] for item in documents],
                "latency_ms": (time.perf_counter() - started) * 1000,
                "graph_trace_count": len(graph_trace),
            }
        )

    print(
        json.dumps(
            {
                "mode": args.mode,
                "top_k": args.top_k,
                "results": results,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
