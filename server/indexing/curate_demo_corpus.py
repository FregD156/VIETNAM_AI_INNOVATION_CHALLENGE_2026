"""Build the reviewed, deterministic demo corpus from the original artifacts.

The script never calls an embedding API. It copies the selected vectors from the
original FAISS artifact, adds the reviewed legal metadata, and rebuilds exact
provision relations. The first run archives the untouched source database/index;
subsequent runs always rebuild from that archive and are therefore idempotent.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import sqlite3
import tempfile
from pathlib import Path

import faiss
import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INDEX_DIR = PROJECT_ROOT / "database" / "indexes"
ARCHIVE_DIR = PROJECT_ROOT / "database" / "archive"
DATABASE_FILE = INDEX_DIR / "data.db"
FAISS_FILE = INDEX_DIR / "faiss.index"
ORIGINAL_DATABASE = ARCHIVE_DIR / "original-data.db"
ORIGINAL_FAISS = ARCHIVE_DIR / "original-faiss.index"
MANIFEST_FILE = PROJECT_ROOT / "database" / "documents" / "dataset-manifest.json"


DOCUMENTS = {
    "SHB-eKYC-2024": {
        "issued_date": "2024-07-15",
        "effective_date": "2024-07-20",
        "status": "Còn hiệu lực",
        "source_type": "internal_demo",
        "source_url": "demo://seed/SHB-eKYC-Procedure-2024.md",
        "version": "2024.1",
    },
    "06/2023/TT-NHNN": {
        "issued_date": "2023-06-28",
        "effective_date": "2023-09-01",
        "status": "Còn hiệu lực",
        "source_type": "external_demo",
        "source_url": "demo://seed/Circular-06-2023-TT-NHNN.md",
        "version": "2023.1",
    },
    "39/2016/TT-NHNN": {
        "issued_date": "2016-12-30",
        "effective_date": "2017-03-15",
        "status": "Còn hiệu lực một phần",
        "source_type": "external_demo",
        "source_url": "demo://seed/Circular-39-2016-TT-NHNN.md",
        "version": "2016.1",
    },
    "SHB-eKYC-2023": {
        "issued_date": "2023-08-01",
        "effective_date": "2023-08-15",
        "status": "Còn hiệu lực một phần",
        "source_type": "internal_demo",
        "source_url": "demo://seed/SHB-eKYC-Procedure-2023.md",
        "version": "2023.1",
    },
    "SHB-Lending-2024": {
        "issued_date": "2024-01-15",
        "effective_date": "2024-02-01",
        "status": "Còn hiệu lực",
        "source_type": "internal_demo",
        "source_url": "demo://seed/SHB-Internal-Lending-Policy-2024.md",
        "version": "2024.1",
    },
    "17/2024/TT-NHNN": {
        "issued_date": "2024-06-28",
        "effective_date": "2024-07-01",
        "status": "Còn hiệu lực",
        "source_type": "external_demo",
        "source_url": "demo://seed/Circular-17-2024-TT-NHNN.md",
        "version": "2024.1",
    },
}


# These passages come from the three banking-relevant public-law source files
# already bundled in the original repository.  They retain their original
# embedding vectors, receive deterministic structural metadata, and are kept
# separate from the six synthetic/simplified scenario documents above.
EXPANSION_DOCUMENTS = {
    "law-2022-luat-phong-chong-rua-tien": {
        "doc_num": "14/2022/QH15",
        "issued_date": "2022-11-15",
        "effective_date": "2023-03-01",
        "status": "Còn hiệu lực",
        "source_type": "official_text_snapshot",
        "source_url": "https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=157721",
        "version": "2022.1",
        "quota": 250,
        "minimum_chars": 100,
    },
    "law-2023-luat-giao-dich-dien-tu": {
        "doc_num": "20/2023/QH15",
        "issued_date": "2023-06-22",
        "effective_date": "2024-07-01",
        "status": "Còn hiệu lực",
        "source_type": "official_text_snapshot",
        "source_url": "https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=165913",
        "version": "2023.1",
        "quota": 200,
        "minimum_chars": 100,
    },
    "law-2025-luat-sua-doi-bo-sung-mot-so-dieu-cua-luat-cac-to-chuc-tin-dung": {
        "doc_num": "96/2025/QH15",
        "issued_date": "2025-06-27",
        "effective_date": "2025-10-15",
        "status": "Còn hiệu lực",
        "source_type": "official_text_snapshot",
        "source_url": "https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=179292",
        "version": "2025.1",
        "quota": 50,
        "minimum_chars": 90,
    },
}

EXPANSION_CHUNKS = sum(item["quota"] for item in EXPANSION_DOCUMENTS.values())


REFERENCES = [
    ("2_art_Điều1_cl_1", "4_art_Điều8_cl_1", "Sửa đổi Điều 8 của Thông tư 39/2016/TT-NHNN."),
    ("2_art_Điều1_cl_2", "4_art_Điều1_cl_1", "Bổ sung quy định cho vay điện tử vào khung Thông tư 39."),
    ("6_art_Điều2_cl_1", "4_art_Điều1_cl_1", "Quy chế nội bộ viện dẫn Thông tư 39/2016/TT-NHNN."),
    ("6_art_Điều2_cl_1", "2_art_Điều1_cl_1", "Quy chế nội bộ áp dụng bản sửa đổi tại Thông tư 06/2023/TT-NHNN."),
    ("6_art_Điều5_cl_3", "2_art_Điều1_cl_2", "Hạn mức e-Lending phải đối chiếu Điều 9a được bổ sung."),
    ("6_art_Điều12_cl_1", "4_art_Điều8_cl_3", "Nhu cầu vốn mua vàng miếng được đối chiếu với Điều 8."),
    ("10_art_Điều1_cl_1", "5_art_Điều1_cl_1", "Bản 2024 sửa đổi quy trình eKYC bản 2023."),
    ("10_art_Điều3_cl_1", "7_art_Điều16_cl_2", "Hạn mức nội bộ phải đối chiếu giới hạn eKYC bên ngoài."),
    ("10_art_Điều3_cl_2", "7_art_Điều16_cl_3", "Yêu cầu sinh trắc học đối chiếu Điều 16 Khoản 3."),
]


SUPERSEDES = [
    (
        "10_art_Điều1_cl_2",
        "5_art_Điều5_cl_1",
        "clause",
        "2024-07-20",
        "Điều 5 Khoản 1 bản 2023 bị thay thế bởi Điều 3 bản 2024.",
    ),
    (
        "10_art_Điều1_cl_2",
        "5_art_Điều5_cl_2",
        "clause",
        "2024-07-20",
        "Điều 5 Khoản 2 bản 2023 bị thay thế bởi Điều 3 bản 2024.",
    ),
    (
        "2_art_Điều1_cl_1",
        "4_art_Điều8_cl_1",
        "article",
        "2023-09-01",
        "Điều 8 của Thông tư 39 được thay thế ở cấp điều bởi nội dung sửa đổi.",
    ),
]


AMENDMENTS = [
    (
        "10_art_Điều1_cl_2",
        "10_art_Điều3_cl_1",
        "Điều khoản thay thế dẫn tới hạn mức eKYC mới tại Điều 3 Khoản 1.",
    ),
    (
        "10_art_Điều1_cl_2",
        "10_art_Điều3_cl_2",
        "Điều khoản thay thế dẫn tới yêu cầu sinh trắc học mới tại Điều 3 Khoản 2.",
    ),
]


CONFLICTS = [
    (
        "10_art_Điều3_cl_1",
        "7_art_Điều16_cl_2",
        "numeric_limit",
        "high",
        "Hạn mức eKYC nội bộ 150 triệu đồng/tháng vượt giới hạn 100 triệu đồng/tháng trong bộ dữ liệu demo bên ngoài.",
        "Giảm hạn mức nội bộ xuống không quá 100 triệu đồng/tháng hoặc yêu cầu quy trình xác minh bổ sung được pháp chế phê duyệt.",
    ),
    (
        "6_art_Điều5_cl_3",
        "2_art_Điều1_cl_2",
        "numeric_limit",
        "high",
        "Hạn mức e-Lending nội bộ 150 triệu đồng vượt giới hạn 100 triệu đồng trong bộ dữ liệu demo bên ngoài.",
        "Điều chỉnh hạn mức sản phẩm và chặn giải ngân vượt ngưỡng cho tới khi chính sách được rà soát.",
    ),
]


CONTENT_OVERRIDES = {
    "6_art_Điều12_cl_1": (
        "QUY CHẾ TÍN DỤNG BÁN LẺ NỘI BỘ SHB (SHB-IRLP-2024) - "
        "Điều 12. Loại trừ nhu cầu vốn vay theo luật định - Khoản 1: "
        "SHB không cấp tín dụng cho nhu cầu vốn dùng để mua vàng miếng."
    )
}


def _column_names(connection: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}


def _add_column(connection: sqlite3.Connection, table: str, definition: str) -> None:
    name = definition.split()[0]
    if name not in _column_names(connection, table):
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {definition}")


def _stable_id(prefix: str, *parts: str) -> str:
    value = "|".join(str(part or "").strip().lower() for part in parts)
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:20]
    return f"{prefix}_{digest}"


def _prepare_schema(connection: sqlite3.Connection) -> None:
    for definition in (
        "document_uid TEXT",
        "issued_date TEXT",
        "source_type TEXT",
        "source_url TEXT",
        "is_synthetic INTEGER NOT NULL DEFAULT 1",
        "version TEXT",
        "reviewed INTEGER NOT NULL DEFAULT 0",
        "review_level TEXT",
        "valid_from TEXT",
        "valid_to TEXT",
    ):
        _add_column(connection, "documents", definition)

    for definition in (
        "provision_id TEXT",
        "version_id TEXT",
        "point TEXT",
        "valid_from TEXT",
        "valid_to TEXT",
        "reviewed INTEGER NOT NULL DEFAULT 0",
        "review_level TEXT",
    ):
        _add_column(connection, "chunks", definition)

    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS provision_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_chunk_id TEXT NOT NULL,
            target_chunk_id TEXT NOT NULL,
            relation_type TEXT NOT NULL,
            scope TEXT NOT NULL DEFAULT 'clause',
            effective_from TEXT,
            effective_to TEXT,
            status TEXT NOT NULL DEFAULT 'reviewed',
            evidence_text TEXT NOT NULL,
            FOREIGN KEY (source_chunk_id) REFERENCES chunks(chunk_id),
            FOREIGN KEY (target_chunk_id) REFERENCES chunks(chunk_id)
        );
        CREATE TABLE IF NOT EXISTS conflict_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            internal_chunk_id TEXT NOT NULL,
            external_chunk_id TEXT NOT NULL,
            conflict_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            resolution TEXT NOT NULL,
            effective_from TEXT,
            effective_to TEXT,
            status TEXT NOT NULL DEFAULT 'reviewed',
            FOREIGN KEY (internal_chunk_id) REFERENCES chunks(chunk_id),
            FOREIGN KEY (external_chunk_id) REFERENCES chunks(chunk_id)
        );
        CREATE INDEX IF NOT EXISTS idx_provision_relations_source
            ON provision_relations(source_chunk_id, relation_type);
        CREATE INDEX IF NOT EXISTS idx_provision_relations_target
            ON provision_relations(target_chunk_id, relation_type);
        CREATE INDEX IF NOT EXISTS idx_chunks_provision_id ON chunks(provision_id);
        """
    )


def _passage_body(embed_text: str) -> str:
    """Remove the repeated document-title prefix used by the legacy indexer."""
    _, separator, body = (embed_text or "").partition(": ")
    return (body if separator else embed_text or "").strip()


def _even_sample(items: list[dict], quota: int) -> list[dict]:
    """Select a deterministic, document-wide sample without front-loading."""
    if len(items) < quota:
        raise RuntimeError(f"Need {quota} expansion passages, found {len(items)}")
    if len(items) == quota:
        return items
    positions = [index * (len(items) - 1) // (quota - 1) for index in range(quota)]
    if len(set(positions)) != quota:
        raise RuntimeError("Expansion sampling produced duplicate positions")
    return [items[position] for position in positions]


def _expansion_rows(connection: sqlite3.Connection) -> list[dict]:
    selected: list[dict] = []
    for source_doc_num, metadata in EXPANSION_DOCUMENTS.items():
        rows = connection.execute(
            """
            SELECT c.chunk_id, c.faiss_index, c.embed_text
            FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
            WHERE d.doc_num = ?
            ORDER BY c.faiss_index
            """,
            (source_doc_num,),
        ).fetchall()
        article = None
        clause = None
        point = None
        candidates: list[dict] = []
        for row in rows:
            body = _passage_body(row["embed_text"] or "")
            article_match = re.match(
                r'^[\"“]?\s*Điều\s+(\d+[a-zA-ZđĐ]?)\s*[.:]',
                body,
                flags=re.IGNORECASE,
            )
            if article_match:
                article = f"Điều {article_match.group(1)}"
                clause = None
                point = None
            clause_match = re.match(
                r'^[\"“]?\s*(\d+)\.\s+', body, flags=re.IGNORECASE
            )
            if clause_match:
                clause = f"Khoản {clause_match.group(1)}"
                point = None
            point_match = re.match(
                r'^[\"“]?\s*([a-zđ])\)\s+', body, flags=re.IGNORECASE
            )
            if point_match:
                point = f"Điểm {point_match.group(1).lower()}"
            if article and len(row["embed_text"] or "") >= metadata["minimum_chars"]:
                candidates.append(
                    {
                        "chunk_id": row["chunk_id"],
                        "faiss_index": row["faiss_index"],
                        "source_doc_num": source_doc_num,
                        "doc_num": metadata["doc_num"],
                        "article": article,
                        "clause": clause or "",
                        "point": point or "",
                        "normalized_text": re.sub(
                            r"\s+", " ", row["embed_text"] or ""
                        ).strip(),
                    }
                )
        sampled = _even_sample(candidates, metadata["quota"])
        if len({item["article"] for item in sampled}) < 3:
            raise RuntimeError(f"Expansion does not cover enough articles: {source_doc_num}")
        selected.extend(sampled)
    if len(selected) != EXPANSION_CHUNKS:
        raise RuntimeError(
            f"Expected {EXPANSION_CHUNKS} expansion chunks, found {len(selected)}"
        )
    return selected


def _curate_database(source: Path, destination: Path) -> list[tuple[int, str]]:
    shutil.copy2(source, destination)
    connection = sqlite3.connect(destination)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA foreign_keys = OFF")
        _prepare_schema(connection)

        placeholders = ",".join("?" for _ in DOCUMENTS)
        base_rows = connection.execute(
            f"""
            SELECT c.chunk_id, c.faiss_index, d.doc_num
            FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
            WHERE d.doc_num IN ({placeholders})
              AND c.article IS NOT NULL AND TRIM(c.article) <> ''
              AND c.article NOT LIKE 'Điều A%'
              AND c.article NOT LIKE 'Điều B%'
            ORDER BY c.faiss_index
            """,
            tuple(DOCUMENTS),
        ).fetchall()
        expansion_rows = _expansion_rows(connection)
        selected_rows = [*base_rows, *expansion_rows]
        keep_chunk_ids = {row["chunk_id"] for row in selected_rows}
        expected_chunks = 76 + EXPANSION_CHUNKS
        if len(base_rows) != 76 or len(keep_chunk_ids) != expected_chunks:
            raise RuntimeError(
                f"Expected 76 scenario + {EXPANSION_CHUNKS} expansion chunks, "
                f"found {len(base_rows)} + {len(expansion_rows)}"
            )

        connection.execute("DELETE FROM references_relations")
        connection.execute("DELETE FROM supersedes_relations")
        connection.execute("DELETE FROM provision_relations")
        connection.execute("DELETE FROM conflict_relations")
        chunk_placeholders = ",".join("?" for _ in keep_chunk_ids)
        connection.execute(
            f"DELETE FROM chunks WHERE chunk_id NOT IN ({chunk_placeholders})",
            tuple(sorted(keep_chunk_ids)),
        )
        source_doc_nums = (*DOCUMENTS, *EXPANSION_DOCUMENTS)
        source_placeholders = ",".join("?" for _ in source_doc_nums)
        connection.execute(
            f"DELETE FROM documents WHERE doc_num NOT IN ({source_placeholders})",
            source_doc_nums,
        )

        for doc_num, metadata in DOCUMENTS.items():
            document_uid = _stable_id("doc", doc_num)
            connection.execute(
                """
                UPDATE documents
                SET document_uid = ?, issued_date = ?, effective_date = ?,
                    source_type = ?, source_url = ?, is_synthetic = 1,
                    version = ?, reviewed = 1, review_level = 'scenario_reviewed',
                    valid_from = ?, valid_to = NULL, status = ?
                WHERE doc_num = ?
                """,
                (
                    document_uid,
                    metadata["issued_date"],
                    metadata["effective_date"],
                    metadata["source_type"],
                    metadata["source_url"],
                    metadata["version"],
                    metadata["effective_date"],
                    metadata["status"],
                    doc_num,
                ),
            )

        for source_doc_num, metadata in EXPANSION_DOCUMENTS.items():
            document_uid = _stable_id("doc", metadata["doc_num"])
            connection.execute(
                """
                UPDATE documents
                SET doc_num = ?, document_uid = ?, issued_date = ?,
                    effective_date = ?, source_type = ?, source_url = ?,
                    is_synthetic = 0, version = ?, reviewed = 1,
                    review_level = 'machine_normalized', valid_from = ?,
                    valid_to = NULL, status = ?
                WHERE doc_num = ?
                """,
                (
                    metadata["doc_num"],
                    document_uid,
                    metadata["issued_date"],
                    metadata["effective_date"],
                    metadata["source_type"],
                    metadata["source_url"],
                    metadata["version"],
                    metadata["effective_date"],
                    metadata["status"],
                    source_doc_num,
                ),
            )

        for row in expansion_rows:
            connection.execute(
                """
                UPDATE chunks SET article = ?, clause = ?, point = ?,
                    embed_text = ?
                WHERE chunk_id = ?
                """,
                (
                    row["article"],
                    row["clause"],
                    row["point"],
                    row["normalized_text"],
                    row["chunk_id"],
                ),
            )

        rows = connection.execute(
            """
            SELECT c.chunk_id, c.article, c.clause, c.point, d.doc_num,
                   d.version, d.effective_date, d.is_synthetic
            FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
            """
        ).fetchall()
        for row in rows:
            provision_id = _stable_id(
                "prov",
                row["doc_num"],
                row["article"],
                row["clause"] or "",
                row["point"] or "",
            )
            version_id = _stable_id(
                "ver", provision_id, row["version"] or "1"
            )
            connection.execute(
                """
                UPDATE chunks SET provision_id = ?, version_id = ?,
                    valid_from = ?, valid_to = NULL, reviewed = 1,
                    review_level = ?
                WHERE chunk_id = ?
                """,
                (
                    provision_id,
                    version_id,
                    row["effective_date"],
                    "scenario_reviewed" if row["is_synthetic"] else "machine_normalized",
                    row["chunk_id"],
                ),
            )

        for chunk_id, content in CONTENT_OVERRIDES.items():
            if chunk_id not in keep_chunk_ids:
                raise RuntimeError(f"Content override target does not exist: {chunk_id}")
            connection.execute(
                "UPDATE chunks SET embed_text = ? WHERE chunk_id = ?",
                (content, chunk_id),
            )

        for source, target, evidence in REFERENCES:
            if source not in keep_chunk_ids or target not in keep_chunk_ids:
                raise RuntimeError(f"Invalid reference relation: {source} -> {target}")
            target_doc = connection.execute(
                """
                SELECT d.doc_num FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
                WHERE c.chunk_id = ?
                """,
                (target,),
            ).fetchone()[0]
            connection.execute(
                "INSERT INTO references_relations(source_chunk_id, target_doc_num) VALUES (?, ?)",
                (source, target_doc),
            )
            connection.execute(
                """
                INSERT INTO provision_relations(
                    source_chunk_id, target_chunk_id, relation_type, scope,
                    status, evidence_text
                ) VALUES (?, ?, 'references', 'clause', 'reviewed', ?)
                """,
                (source, target, evidence),
            )

        for source, target, scope, effective_from, evidence in SUPERSEDES:
            target_row = connection.execute(
                """
                SELECT d.doc_num, c.article, c.clause
                FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
                WHERE c.chunk_id = ?
                """,
                (target,),
            ).fetchone()
            connection.execute(
                """
                INSERT INTO supersedes_relations(
                    source_chunk_id, target_doc_num, target_article, target_clause
                ) VALUES (?, ?, ?, ?)
                """,
                (
                    source,
                    target_row["doc_num"],
                    target_row["article"],
                    target_row["clause"] if scope == "clause" else None,
                ),
            )
            connection.execute(
                """
                INSERT INTO provision_relations(
                    source_chunk_id, target_chunk_id, relation_type, scope,
                    effective_from, status, evidence_text
                ) VALUES (?, ?, 'supersedes', ?, ?, 'reviewed', ?)
                """,
                (source, target, scope, effective_from, evidence),
            )
            valid_to = "2024-07-19" if effective_from == "2024-07-20" else "2023-08-31"
            if scope == "article":
                connection.execute(
                    """
                    UPDATE chunks SET valid_to = ?
                    WHERE doc_id = (SELECT doc_id FROM chunks WHERE chunk_id = ?)
                      AND article = (SELECT article FROM chunks WHERE chunk_id = ?)
                    """,
                    (valid_to, target, target),
                )
            else:
                connection.execute(
                    "UPDATE chunks SET valid_to = ? WHERE chunk_id = ?",
                    (valid_to, target),
                )

        for source, target, evidence in AMENDMENTS:
            connection.execute(
                """
                INSERT INTO provision_relations(
                    source_chunk_id, target_chunk_id, relation_type, scope,
                    effective_from, status, evidence_text
                ) VALUES (?, ?, 'amends', 'clause', '2024-07-20', 'reviewed', ?)
                """,
                (source, target, evidence),
            )

        for internal, external, kind, severity, description, resolution in CONFLICTS:
            connection.execute(
                """
                INSERT INTO conflict_relations(
                    internal_chunk_id, external_chunk_id, conflict_type, severity,
                    description, resolution, effective_from, status
                ) VALUES (?, ?, ?, ?, ?, ?, '2024-07-20', 'reviewed')
                """,
                (internal, external, kind, severity, description, resolution),
            )
            connection.execute(
                """
                INSERT INTO provision_relations(
                    source_chunk_id, target_chunk_id, relation_type, scope,
                    effective_from, status, evidence_text
                ) VALUES (?, ?, 'conflicts_with', 'clause', '2024-07-20', 'reviewed', ?)
                """,
                (internal, external, description),
            )

        selected_vectors = sorted(
            [(row["faiss_index"], row["chunk_id"]) for row in selected_rows]
        )
        for new_index, (_, chunk_id) in enumerate(selected_vectors):
            connection.execute(
                "UPDATE chunks SET faiss_index = ? WHERE chunk_id = ?",
                (new_index, chunk_id),
            )

        connection.commit()
        problems = connection.execute("PRAGMA foreign_key_check").fetchall()
        if problems:
            raise RuntimeError(f"Foreign-key validation failed: {problems}")
        return selected_vectors
    finally:
        connection.close()


def _curate_faiss(source: Path, destination: Path, selected: list[tuple[int, str]]) -> None:
    original = faiss.read_index(str(source))
    original_ids = faiss.vector_to_array(original.id_map)
    id_to_position = {int(identifier): pos for pos, identifier in enumerate(original_ids)}
    base = faiss.downcast_index(original.index)
    vectors = np.vstack(
        [base.reconstruct(id_to_position[int(old_id)]) for old_id, _ in selected]
    ).astype("float32")
    rebuilt = faiss.IndexIDMap(faiss.IndexFlatIP(original.d))
    rebuilt.add_with_ids(vectors, np.arange(len(selected), dtype="int64"))
    faiss.write_index(rebuilt, str(destination))


def _validate(database: Path, index_file: Path) -> dict[str, int]:
    connection = sqlite3.connect(database)
    try:
        result = {
            "documents": connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0],
            "chunks": connection.execute("SELECT COUNT(*) FROM chunks").fetchone()[0],
            "references": connection.execute(
                "SELECT COUNT(*) FROM provision_relations WHERE relation_type='references'"
            ).fetchone()[0],
            "supersessions": connection.execute(
                "SELECT COUNT(*) FROM provision_relations WHERE relation_type='supersedes'"
            ).fetchone()[0],
            "amendments": connection.execute(
                "SELECT COUNT(*) FROM provision_relations WHERE relation_type='amends'"
            ).fetchone()[0],
            "conflicts": connection.execute("SELECT COUNT(*) FROM conflict_relations").fetchone()[0],
            "missing_article": connection.execute(
                "SELECT COUNT(*) FROM chunks WHERE article IS NULL OR TRIM(article)=''"
            ).fetchone()[0],
            "missing_metadata": connection.execute(
                """
                SELECT COUNT(*) FROM documents
                WHERE document_uid IS NULL OR issued_date IS NULL OR effective_date IS NULL
                   OR source_type IS NULL OR source_url IS NULL OR version IS NULL
                """
            ).fetchone()[0],
            "scenario_chunks": connection.execute(
                "SELECT COUNT(*) FROM chunks WHERE review_level='scenario_reviewed'"
            ).fetchone()[0],
            "machine_normalized_chunks": connection.execute(
                "SELECT COUNT(*) FROM chunks WHERE review_level='machine_normalized'"
            ).fetchone()[0],
            "official_documents": connection.execute(
                "SELECT COUNT(*) FROM documents WHERE is_synthetic=0"
            ).fetchone()[0],
        }
    finally:
        connection.close()
    result["vectors"] = faiss.read_index(str(index_file)).ntotal
    expected = {
        "documents": 9,
        "chunks": 576,
        "references": 9,
        "supersessions": 3,
        "amendments": 2,
        "conflicts": 2,
        "missing_article": 0,
        "missing_metadata": 0,
        "scenario_chunks": 76,
        "machine_normalized_chunks": 500,
        "official_documents": 3,
        "vectors": 576,
    }
    if result != expected:
        raise RuntimeError(f"Corpus validation failed: {result} != {expected}")
    return result


def main() -> None:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    if not ORIGINAL_DATABASE.exists():
        shutil.copy2(DATABASE_FILE, ORIGINAL_DATABASE)
    if not ORIGINAL_FAISS.exists():
        shutil.copy2(FAISS_FILE, ORIGINAL_FAISS)

    with tempfile.TemporaryDirectory(prefix="curate-", dir=INDEX_DIR) as temp_dir:
        temp_root = Path(temp_dir)
        next_database = temp_root / "data.db"
        next_faiss = temp_root / "faiss.index"
        selected = _curate_database(ORIGINAL_DATABASE, next_database)
        _curate_faiss(ORIGINAL_FAISS, next_faiss, selected)
        result = _validate(next_database, next_faiss)
        shutil.move(next_database, DATABASE_FILE)
        shutil.move(next_faiss, FAISS_FILE)

    manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
    manifest["generated_counts"] = result
    MANIFEST_FILE.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
