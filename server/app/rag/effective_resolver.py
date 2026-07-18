from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import date
from typing import Any, Iterable, Union, Optional

from app.core.paths import SQLITE_DATABASE_FILE


class EffectiveResolver:
    """Single source of truth for provision validity at an as-of date."""

    def __init__(self, database_file: Optional[str] = None):
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)

    @staticmethod
    def normalize_as_of(as_of: Optional[Union[str, date]] = None) -> str:
        if isinstance(as_of, date):
            return as_of.isoformat()
        if as_of:
            return date.fromisoformat(str(as_of)).isoformat()
        return date.today().isoformat()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_file)
        connection.row_factory = sqlite3.Row
        return connection

    def resolve(
        self,
        chunk_id: str,
        as_of: Optional[Union[str, date]] = None,
        _visited: Optional[set[str]] = None,
    ) -> dict[str, Any]:
        resolved_date = self.normalize_as_of(as_of)
        visited = set(_visited or ())
        if chunk_id in visited:
            return {
                "chunk_id": chunk_id,
                "as_of": resolved_date,
                "is_effective": False,
                "state": "ambiguous_cycle",
                "reason": "Phát hiện chu trình trong chuỗi thay thế.",
                "replacement_path": list(visited) + [chunk_id],
            }
        visited.add(chunk_id)

        with closing(self._connect()) as connection:
            chunk = connection.execute(
                """
                SELECT c.chunk_id, c.doc_id, c.article, c.clause,
                       c.valid_from AS chunk_valid_from,
                       c.valid_to AS chunk_valid_to,
                       c.reviewed AS chunk_reviewed,
                       d.doc_num, d.status, d.valid_from AS doc_valid_from,
                       d.valid_to AS doc_valid_to, d.reviewed AS doc_reviewed
                FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
                WHERE c.chunk_id = ?
                """,
                (chunk_id,),
            ).fetchone()
            if chunk is None:
                return {
                    "chunk_id": chunk_id,
                    "as_of": resolved_date,
                    "is_effective": False,
                    "state": "missing",
                    "reason": "Điều khoản không tồn tại trong corpus đã duyệt.",
                    "replacement_path": [],
                }

            if not chunk["chunk_reviewed"] or not chunk["doc_reviewed"]:
                return self._result(
                    chunk, resolved_date, False, "unreviewed", "Nguồn chưa được duyệt."
                )

            valid_from = chunk["chunk_valid_from"] or chunk["doc_valid_from"]
            valid_to = chunk["chunk_valid_to"] or chunk["doc_valid_to"]
            if valid_from and resolved_date < valid_from:
                return self._result(
                    chunk,
                    resolved_date,
                    False,
                    "not_yet_effective",
                    f"Điều khoản chỉ có hiệu lực từ {valid_from}.",
                )

            incoming = connection.execute(
                """
                SELECT pr.source_chunk_id, pr.target_chunk_id, pr.scope,
                       pr.effective_from, pr.effective_to, pr.evidence_text
                FROM provision_relations pr
                JOIN chunks target ON target.chunk_id = pr.target_chunk_id
                JOIN chunks candidate ON candidate.chunk_id = ?
                WHERE pr.relation_type = 'supersedes'
                  AND pr.status = 'reviewed'
                  AND (
                    pr.target_chunk_id = candidate.chunk_id
                    OR (
                      pr.scope = 'article'
                      AND target.doc_id = candidate.doc_id
                      AND target.article = candidate.article
                    )
                  )
                ORDER BY pr.effective_from, pr.id
                """,
                (chunk_id,),
            ).fetchall()

        for relation in incoming:
            if relation["effective_from"] and resolved_date < relation["effective_from"]:
                continue
            if relation["effective_to"] and resolved_date > relation["effective_to"]:
                continue
            successor = self.resolve(
                relation["source_chunk_id"], resolved_date, _visited=visited
            )
            if successor["state"] == "ambiguous_cycle":
                return self._result(
                    chunk,
                    resolved_date,
                    False,
                    "ambiguous_cycle",
                    "Phát hiện chu trình trong chuỗi thay thế; cần pháp chế rà soát.",
                    [chunk_id, relation["source_chunk_id"], *successor["replacement_path"]],
                )
            if successor["is_effective"]:
                return self._result(
                    chunk,
                    resolved_date,
                    False,
                    "superseded",
                    relation["evidence_text"],
                    [chunk_id, relation["source_chunk_id"], *successor["replacement_path"]],
                )

        if valid_to and resolved_date > valid_to:
            return self._result(
                chunk,
                resolved_date,
                False,
                "expired",
                f"Điều khoản hết hiệu lực sau {valid_to}.",
            )

        status = str(chunk["status"] or "").lower()
        if status in {"hết hiệu lực", "superseded", "repealed"}:
            return self._result(
                chunk,
                resolved_date,
                False,
                "inactive_document",
                "Văn bản đã hết hiệu lực.",
            )

        return self._result(
            chunk,
            resolved_date,
            True,
            "effective",
            f"Điều khoản có hiệu lực tại {resolved_date}.",
        )

    def resolve_documents(
        self, documents: Iterable[dict[str, Any]], as_of: Optional[Union[str, date]] = None
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        included: list[dict[str, Any]] = []
        excluded: list[dict[str, Any]] = []
        for document in documents:
            result = self.resolve(document.get("chunk_id", ""), as_of)
            enriched = {
                **document,
                "temporal_status": result["state"],
                "temporal_reason": result["reason"],
                "as_of": result["as_of"],
                "replacement_path": result["replacement_path"],
            }
            (included if result["is_effective"] else excluded).append(enriched)
        return included, excluded

    @staticmethod
    def _result(
        chunk: sqlite3.Row,
        as_of: str,
        is_effective: bool,
        state: str,
        reason: str,
        replacement_path: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        return {
            "chunk_id": chunk["chunk_id"],
            "doc_num": chunk["doc_num"],
            "article": chunk["article"],
            "clause": chunk["clause"],
            "as_of": as_of,
            "is_effective": is_effective,
            "state": state,
            "reason": reason,
            "replacement_path": replacement_path or [],
        }
