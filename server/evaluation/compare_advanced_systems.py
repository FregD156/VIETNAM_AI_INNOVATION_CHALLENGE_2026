from typing import Optional, Union
"""Compare the original and upgraded Advanced RAG retrieval paths."""

from __future__ import annotations

import argparse
import json
import sqlite3
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ADAPTER = Path(__file__).with_name("system_retrieval_adapter.py")
DEFAULT_CASES = Path(__file__).with_name("advanced_comparison_cases.json")
DEFAULT_OUTPUT = PROJECT_ROOT / "docs" / "evaluation" / "advanced-comparison-results.json"


def _run_adapter(repo: Path, cases: Path, mode: str, top_k: int) -> dict:
    process = subprocess.run(
        [
            sys.executable,
            str(ADAPTER),
            "--repo",
            str(repo),
            "--cases",
            str(cases),
            "--mode",
            mode,
            "--top-k",
            str(top_k),
        ],
        cwd=repo,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(process.stdout)


def _corpus_stats(repo: Path) -> dict:
    database = repo / "database" / "indexes" / "data.db"
    with sqlite3.connect(database) as connection:
        documents = connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        chunks = connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
        missing_article = connection.execute(
            "SELECT COUNT(*) FROM chunks WHERE article IS NULL OR TRIM(article)=''"
        ).fetchone()[0]
    return {
        "documents": documents,
        "chunks": chunks,
        "missing_article": missing_article,
    }


def _evaluate(cases: list[dict], payload: dict) -> tuple[list[dict], dict]:
    result_by_id = {item["id"]: item for item in payload["results"]}
    evaluations = []
    for case in cases:
        runtime = result_by_id[case["id"]]
        chunk_ids = runtime["chunk_ids"]
        expected = set(case.get("expected_chunks", []))
        forbidden = set(case.get("forbidden_chunks", []))
        hits = expected & set(chunk_ids)
        recall = len(hits) / len(expected) if expected else None
        reciprocal_rank = 0.0
        for rank, chunk_id in enumerate(chunk_ids, start=1):
            if chunk_id in expected:
                reciprocal_rank = 1 / rank
                break
        should_abstain = case.get("should_abstain")
        evaluations.append(
            {
                "id": case["id"],
                "category": case["category"],
                "chunk_ids": chunk_ids,
                "recall": recall,
                "reciprocal_rank": reciprocal_rank,
                "forbidden_returned": sorted(forbidden & set(chunk_ids)),
                "abstention_success": (
                    (not chunk_ids) == should_abstain
                    if should_abstain is not None
                    else None
                ),
                "latency_ms": runtime["latency_ms"],
                "graph_trace_count": runtime["graph_trace_count"],
            }
        )

    def average(values: Optional[Union[list[float, bool]]]) -> float:
        present = [float(value) for value in values if value is not None]
        return sum(present) / len(present) if present else 0.0

    retrieval_cases = [item for item in evaluations if item["recall"] is not None]
    expansion_cases = [
        item for item in retrieval_cases if item["category"].startswith("expanded_")
    ]
    scenario_cases = [
        item for item in retrieval_cases if not item["category"].startswith("expanded_")
    ]
    metrics = {
        "recall_at_5": average([item["recall"] for item in retrieval_cases]),
        "mrr": average([item["reciprocal_rank"] for item in retrieval_cases]),
        "scenario_recall_at_5": average([item["recall"] for item in scenario_cases]),
        "expanded_recall_at_5": average([item["recall"] for item in expansion_cases]),
        "stale_leakage_rate": average(
            [bool(item["forbidden_returned"]) for item in evaluations]
        ),
        "abstention_accuracy": average(
            [item["abstention_success"] for item in evaluations]
        ),
        "mean_latency_ms": average([item["latency_ms"] for item in evaluations]),
        "graph_cases_with_trace": sum(item["graph_trace_count"] > 0 for item in evaluations),
    }
    return evaluations, metrics


def _git_revision(repo: Path) -> dict:
    revision = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        cwd=repo,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    dirty = bool(
        subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    )
    return {"revision": revision, "dirty": dirty}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--original-repo", type=Path, required=True)
    parser.add_argument("--upgraded-repo", type=Path, default=PROJECT_ROOT)
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    original_repo = args.original_repo.resolve()
    upgraded_repo = args.upgraded_repo.resolve()
    cases_path = args.cases.resolve()
    cases = json.loads(cases_path.read_text(encoding="utf-8"))

    original_raw = _run_adapter(original_repo, cases_path, "original", args.top_k)
    upgraded_raw = _run_adapter(upgraded_repo, cases_path, "upgraded", args.top_k)
    original_cases, original_metrics = _evaluate(cases, original_raw)
    upgraded_cases, upgraded_metrics = _evaluate(cases, upgraded_raw)

    report = {
        "methodology": (
            "Advanced-vs-Advanced offline retrieval comparison. Both systems run "
            "their own checked-out Advanced retrieval path on the same gold queries "
            "and top-5 budget. External embedding, reranker and answer generation are "
            "disabled for determinism. The upgraded FPT path includes deterministic "
            "server-side graph expansion; the original FPT path has tools disabled and "
            "therefore uses its direct Advanced hybrid retrieval path."
        ),
        "fairness_limitations": [
            "The corpora overlap but are not identical: original has 1281 chunks; upgraded has 576 normalized chunks.",
            "Results measure the two end-to-end repository states, not an isolated single-variable architecture ablation.",
            "The 10 expansion cases were manually selected from provisions present in both repositories.",
            "LLM answer quality and online embedding/reranker variance are evaluated separately by live smoke tests.",
        ],
        "gold_cases": len(cases),
        "top_k": args.top_k,
        "original": {
            "repository": str(original_repo),
            **_git_revision(original_repo),
            "corpus": _corpus_stats(original_repo),
            "metrics": original_metrics,
            "cases": original_cases,
        },
        "upgraded": {
            "repository": str(upgraded_repo),
            **_git_revision(upgraded_repo),
            "corpus": _corpus_stats(upgraded_repo),
            "metrics": upgraded_metrics,
            "cases": upgraded_cases,
        },
        "delta": {
            key: upgraded_metrics[key] - original_metrics[key]
            for key in (
                "recall_at_5",
                "mrr",
                "scenario_recall_at_5",
                "expanded_recall_at_5",
                "stale_leakage_rate",
                "abstention_accuracy",
                "mean_latency_ms",
            )
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "output": str(args.output),
        "gold_cases": len(cases),
        "original": original_metrics,
        "upgraded": upgraded_metrics,
        "delta": report["delta"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
