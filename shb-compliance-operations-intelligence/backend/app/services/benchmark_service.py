import re
import sqlite3
from contextlib import closing
from typing import Any, Dict, List

from rank_bm25 import BM25Okapi
from app.core.paths import SQLITE_DATABASE_FILE
from app.rag.knowledge_graph import GraphService


CASES = [
    ("Hạn mức giao dịch tài khoản mở bằng eKYC", "17/2024/TT-NHNN"),
    ("quy trình định danh điện tử eKYC SHB", "SHB-eKYC-2024"),
    ("điều kiện vay vốn ngân hàng", "39/2016/TT-NHNN"),
    ("phòng chống rửa tiền nhận biết khách hàng", "law-2022-luat-phong-chong-rua-tien"),
    ("chính sách cho vay nội bộ SHB", "SHB-Lending-2024"),
    ("mở và sử dụng tài khoản thanh toán", "17/2024/TT-NHNN"),
    ("giao dịch điện tử chữ ký điện tử", "law-2023-luat-giao-dich-dien-tu"),
    ("thuế thu nhập doanh nghiệp", "law-2008-luat-thue-thu-nhap-doanh-nghiep"),
    ("sửa đổi luật các tổ chức tín dụng", "law-2025-luat-sua-doi-bo-sung-mot-so-dieu-cua-luat-cac-to-chuc-tin-dung"),
    ("quy định hoạt động cho vay của tổ chức tín dụng", "39/2016/TT-NHNN"),
]


class BenchmarkService:
    def __init__(self, database_file: str | None = None):
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"\w+", (text or "").lower(), re.UNICODE)

    def run(self, top_k: int = 5) -> Dict[str, Any]:
        with closing(sqlite3.connect(self.database_file)) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """
                SELECT c.chunk_id, c.embed_text, d.doc_num
                FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
                ORDER BY c.faiss_index
                """
            ).fetchall()

        chunks = [dict(row) for row in rows]
        bm25 = BM25Okapi([self._tokenize(chunk["embed_text"]) for chunk in chunks])
        graph = GraphService()
        graph.load_graph()
        superseded = {
            target
            for _, target, data in graph.graph.edges(data=True)
            if data.get("type") == "supersedes"
        }

        case_results = []
        for query, expected_doc in CASES:
            scores = bm25.get_scores(self._tokenize(query))
            ranked = sorted(range(len(chunks)), key=lambda index: scores[index], reverse=True)
            standard = [chunks[index] for index in ranked[:top_k]]
            advanced = []
            for index in ranked:
                candidate = chunks[index]
                article_key = self._article_key(graph, candidate["chunk_id"])
                if candidate["chunk_id"] in superseded or article_key in superseded:
                    continue
                advanced.append(candidate)
                if len(advanced) == top_k:
                    break

            case_results.append(
                {
                    "query": query,
                    "expected_doc": expected_doc,
                    "standard_hit": any(item["doc_num"] == expected_doc for item in standard),
                    "advanced_hit": any(item["doc_num"] == expected_doc for item in advanced),
                    "standard_superseded": sum(self._is_superseded(item, graph, superseded) for item in standard),
                    "advanced_superseded": sum(self._is_superseded(item, graph, superseded) for item in advanced),
                }
            )

        total = len(case_results)
        return {
            "methodology": "BM25 retrieval benchmark chạy offline trên 10 câu hỏi cố định; Advanced bổ sung lọc supersession trước top-k.",
            "top_k": top_k,
            "cases": case_results,
            "metrics": {
                "standard_hit_rate": sum(case["standard_hit"] for case in case_results) / total,
                "advanced_hit_rate": sum(case["advanced_hit"] for case in case_results) / total,
                "standard_superseded_results": sum(case["standard_superseded"] for case in case_results),
                "advanced_superseded_results": sum(case["advanced_superseded"] for case in case_results),
            },
        }

    @staticmethod
    def _article_key(graph: GraphService, chunk_id: str) -> str:
        node = graph.graph.nodes.get(chunk_id, {})
        if node.get("doc_num") and node.get("article"):
            return f"{node['doc_num']}|{node['article']}"
        return ""

    def _is_superseded(self, item: Dict[str, Any], graph: GraphService, superseded: set) -> bool:
        return item["chunk_id"] in superseded or self._article_key(graph, item["chunk_id"]) in superseded
