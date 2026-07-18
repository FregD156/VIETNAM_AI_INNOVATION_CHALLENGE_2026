from __future__ import annotations

import sqlite3
from contextlib import closing
from typing import Any, Optional

from app.core.paths import SQLITE_DATABASE_FILE
from app.rag.effective_resolver import EffectiveResolver


class ConflictDetector:
    """Return only reviewed conflicts whose exact evidence is in the pack."""

    def __init__(self, database_file: Optional[str] = None):
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)
        self.resolver = EffectiveResolver(self.database_file)
        self.last_status = "not_evaluated"

    def detect_conflicts(
        self,
        docs: list[dict[str, Any]],
        model: Optional[str] = None,
        as_of: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        del model  # The model may explain later; it cannot create runtime findings.
        evidence_ids = {item.get("chunk_id") for item in docs if item.get("chunk_id")}
        focus_ids = {
            item.get("chunk_id")
            for item in docs
            if item.get("chunk_id") and item.get("exact_match")
        }
        if not evidence_ids:
            self.last_status = "insufficient_evidence"
            return []

        has_internal = any(
            str(item.get("metadata", {}).get("source_type", "")).startswith("internal")
            for item in docs
        )
        has_external = any(
            str(item.get("metadata", {}).get("source_type", "")).startswith("external")
            for item in docs
        )
        if not (has_internal and has_external):
            self.last_status = "insufficient_evidence"
            return []

        placeholders = ",".join("?" for _ in evidence_ids)
        resolved_date = self.resolver.normalize_as_of(as_of)
        with closing(sqlite3.connect(self.database_file)) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                f"""
                SELECT cr.*, internal.article AS internal_article,
                       internal.clause AS internal_clause,
                       internal_doc.doc_num AS internal_doc_num,
                       external.article AS external_article,
                       external.clause AS external_clause,
                       external_doc.doc_num AS external_doc_num
                FROM conflict_relations cr
                JOIN chunks internal ON internal.chunk_id = cr.internal_chunk_id
                JOIN documents internal_doc ON internal_doc.doc_id = internal.doc_id
                JOIN chunks external ON external.chunk_id = cr.external_chunk_id
                JOIN documents external_doc ON external_doc.doc_id = external.doc_id
                WHERE cr.status = 'reviewed'
                  AND cr.internal_chunk_id IN ({placeholders})
                  AND cr.external_chunk_id IN ({placeholders})
                  AND (cr.effective_from IS NULL OR cr.effective_from <= ?)
                  AND (cr.effective_to IS NULL OR cr.effective_to >= ?)
                ORDER BY cr.id
                """,
                (*evidence_ids, *evidence_ids, resolved_date, resolved_date),
            ).fetchall()

        findings = []
        for row in rows:
            if focus_ids and not (
                {row["internal_chunk_id"], row["external_chunk_id"]} & focus_ids
            ):
                continue
            if not self.resolver.resolve(row["internal_chunk_id"], resolved_date)[
                "is_effective"
            ]:
                continue
            if not self.resolver.resolve(row["external_chunk_id"], resolved_date)[
                "is_effective"
            ]:
                continue
            findings.append(
                {
                    "type": f"Xung đột tiềm ẩn · {row['conflict_type']}",
                    "severity": row["severity"],
                    "description": row["description"],
                    "law_clause": self._locator(
                        row["external_doc_num"],
                        row["external_article"],
                        row["external_clause"],
                    ),
                    "policy_clause": self._locator(
                        row["internal_doc_num"],
                        row["internal_article"],
                        row["internal_clause"],
                    ),
                    "law_chunk_id": row["external_chunk_id"],
                    "policy_chunk_id": row["internal_chunk_id"],
                    "evidence_ids": [
                        row["external_chunk_id"],
                        row["internal_chunk_id"],
                    ],
                    "resolution": row["resolution"],
                    "review_status": row["status"],
                }
            )
        self.last_status = "detected" if findings else "no_conflict_found"
        return findings

    @staticmethod
    def _locator(doc_num: str, article: str, clause: Optional[str]) -> str:
        return " · ".join(part for part in (doc_num, article, clause) if part)
