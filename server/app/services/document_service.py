import sqlite3
from contextlib import closing
from typing import Any, Dict, List, Optional
from app.core.paths import SQLITE_DATABASE_FILE


class DocumentService:
    def __init__(self, database_file: Optional[str] = None):
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_file)
        connection.row_factory = sqlite3.Row
        return connection

    def get_stats(self) -> Dict[str, int]:
        with closing(self._connect()) as connection:
            return {
                "documents": connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0],
                "chunks": connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0],
                "references": connection.execute("SELECT COUNT(*) FROM references_relations").fetchone()[0],
                "supersessions": connection.execute("SELECT COUNT(*) FROM supersedes_relations").fetchone()[0],
                "amendments": connection.execute(
                    "SELECT COUNT(*) FROM provision_relations WHERE relation_type = 'amends'"
                ).fetchone()[0],
                "conflicts": connection.execute(
                    "SELECT COUNT(*) FROM conflict_relations WHERE status = 'reviewed'"
                ).fetchone()[0],
                "reviewed_chunks": connection.execute(
                    "SELECT COUNT(*) FROM chunks WHERE reviewed = 1"
                ).fetchone()[0],
                "scenario_reviewed_chunks": connection.execute(
                    "SELECT COUNT(*) FROM chunks WHERE review_level = 'scenario_reviewed'"
                ).fetchone()[0],
                "machine_normalized_chunks": connection.execute(
                    "SELECT COUNT(*) FROM chunks WHERE review_level = 'machine_normalized'"
                ).fetchone()[0],
                "official_documents": connection.execute(
                    "SELECT COUNT(*) FROM documents WHERE is_synthetic = 0"
                ).fetchone()[0],
            }

    def list_documents(
        self, limit: int = 6, offset: int = 0, query_text: str = ""
    ) -> Dict[str, Any]:
        limit = max(1, min(limit, 50))
        offset = max(0, offset)
        query_text = query_text.strip()
        where_clause = ""
        parameters: List[Any] = []
        if query_text:
            where_clause = "WHERE d.doc_num LIKE ? OR d.title LIKE ?"
            pattern = f"%{query_text}%"
            parameters.extend([pattern, pattern])

        query = """
            SELECT d.doc_id, d.document_uid, d.doc_num, d.title,
                   d.issued_date, d.effective_date, d.expiration_date, d.status,
                   d.source_type, d.source_url, d.is_synthetic, d.version,
                   d.reviewed, d.review_level, d.valid_from, d.valid_to,
                   COUNT(DISTINCT c.chunk_id) AS chunk_count,
                   COUNT(DISTINCT rr.id) AS reference_count,
                   COUNT(DISTINCT sr.id) AS supersession_count
            FROM documents d
            LEFT JOIN chunks c ON c.doc_id = d.doc_id
            LEFT JOIN references_relations rr ON rr.source_chunk_id = c.chunk_id
            LEFT JOIN supersedes_relations sr ON sr.source_chunk_id = c.chunk_id
            {where_clause}
            GROUP BY d.doc_id
            ORDER BY COALESCE(d.effective_date, '') DESC, d.title ASC
            LIMIT ? OFFSET ?
        """.format(where_clause=where_clause)
        with closing(self._connect()) as connection:
            total = connection.execute(
                f"SELECT COUNT(*) FROM documents d {where_clause}", parameters
            ).fetchone()[0]
            rows = connection.execute(
                query, [*parameters, limit, offset]
            ).fetchall()
        return {
            "documents": [dict(row) for row in rows],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def get_document(
        self, doc_id: str, chunk_limit: int = 12, chunk_offset: int = 0
    ) -> Optional[Dict[str, Any]]:
        chunk_limit = max(1, min(chunk_limit, 50))
        chunk_offset = max(0, chunk_offset)
        with closing(self._connect()) as connection:
            document = connection.execute(
                """
                SELECT doc_id, document_uid, doc_num, title, issued_date,
                       effective_date, expiration_date, status, source_type,
                       source_url, is_synthetic, version, reviewed, review_level,
                       valid_from, valid_to
                FROM documents WHERE doc_id = ?
                """,
                (doc_id,),
            ).fetchone()
            if document is None:
                return None

            chunk_count = connection.execute(
                "SELECT COUNT(*) FROM chunks WHERE doc_id = ?", (doc_id,)
            ).fetchone()[0]
            chunks = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT chunk_id, provision_id, version_id, article, clause,
                           point, valid_from, valid_to, reviewed, review_level
                    FROM chunks WHERE doc_id = ?
                    ORDER BY faiss_index
                    LIMIT ? OFFSET ?
                    """,
                    (doc_id, chunk_limit, chunk_offset),
                ).fetchall()
            ]
            references = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT rr.source_chunk_id, rr.target_doc_num
                    FROM references_relations rr
                    JOIN chunks c ON c.chunk_id = rr.source_chunk_id
                    WHERE c.doc_id = ?
                    ORDER BY rr.source_chunk_id
                    """,
                    (doc_id,),
                ).fetchall()
            ]
            supersessions = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT sr.source_chunk_id, sr.target_doc_num,
                           sr.target_article, sr.target_clause
                    FROM supersedes_relations sr
                    JOIN chunks c ON c.chunk_id = sr.source_chunk_id
                    WHERE c.doc_id = ?
                    ORDER BY sr.source_chunk_id
                    """,
                    (doc_id,),
                ).fetchall()
            ]
            relations = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT pr.source_chunk_id, pr.target_chunk_id,
                           pr.relation_type, pr.scope, pr.effective_from,
                           pr.effective_to, pr.status, pr.evidence_text
                    FROM provision_relations pr
                    JOIN chunks c ON c.chunk_id = pr.source_chunk_id
                    WHERE c.doc_id = ?
                    ORDER BY pr.relation_type, pr.id
                    """,
                    (doc_id,),
                ).fetchall()
            ]

        result = dict(document)
        result.update(
            {
                "chunks": chunks,
                "chunk_count": chunk_count,
                "chunk_limit": chunk_limit,
                "chunk_offset": chunk_offset,
                "references": references,
                "supersessions": supersessions,
                "relations": relations,
            }
        )
        return result

    def get_chunk(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        with closing(self._connect()) as connection:
            chunk = connection.execute(
                """
                SELECT c.chunk_id, c.provision_id, c.version_id, c.article,
                       c.clause, c.point, c.embed_text, c.valid_from,
                       c.valid_to, c.reviewed, c.review_level,
                       d.doc_id, d.document_uid, d.doc_num, d.title,
                       d.issued_date, d.effective_date, d.expiration_date,
                       d.status, d.source_type, d.source_url,
                       d.is_synthetic, d.version,
                       d.review_level AS document_review_level
                FROM chunks c
                JOIN documents d ON d.doc_id = c.doc_id
                WHERE c.chunk_id = ?
                """,
                (chunk_id,),
            ).fetchone()
            if chunk is None:
                return None
            references = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT target_doc_num FROM references_relations
                    WHERE source_chunk_id = ?
                    """,
                    (chunk_id,),
                ).fetchall()
            ]
            supersessions = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT target_doc_num, target_article, target_clause
                    FROM supersedes_relations WHERE source_chunk_id = ?
                    """,
                    (chunk_id,),
                ).fetchall()
            ]
            relations = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT source_chunk_id, target_chunk_id, relation_type,
                           scope, effective_from, effective_to, status,
                           evidence_text
                    FROM provision_relations
                    WHERE source_chunk_id = ? OR target_chunk_id = ?
                    ORDER BY relation_type, id
                    """,
                    (chunk_id, chunk_id),
                ).fetchall()
            ]
        result = dict(chunk)
        result["references"] = references
        result["supersessions"] = supersessions
        result["relations"] = relations
        return result
