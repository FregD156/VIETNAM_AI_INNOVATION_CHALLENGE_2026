import faiss
import os
import numpy as np
import json
import re
from typing import List, Optional, Dict, Any
from app.core.paths import FAISS_INDEX_FILE, SQLITE_DATABASE_FILE
from app.integrations.llm_client import ChatService

FAISS_INDEX_FILE = str(FAISS_INDEX_FILE)
SQLITE_DATABASE_FILE = str(SQLITE_DATABASE_FILE)

class SearchService:
    def __init__(self, threshold=0.5):
        self.threshold = threshold
        self.chat_service = ChatService() # Dùng để embed query
        
        # Load dữ liệu tĩnh
        if not os.path.exists(FAISS_INDEX_FILE):
            raise FileNotFoundError(f"Không tìm thấy file index: {FAISS_INDEX_FILE}")
        self.index = faiss.read_index(FAISS_INDEX_FILE)
        
        # Initialize database structures
        self.faiss_id_map = {}
        self.chunk_map = {}
        self.article_index_map = {}
        self.chunks_text_map = {}

        # Initialize database structures
        self.faiss_id_map = {}
        self.chunk_map = {}
        self.article_index_map = {}
        self.chunks_text_map = {}

        sqlite_db_path = SQLITE_DATABASE_FILE
        if not os.path.exists(sqlite_db_path):
            raise FileNotFoundError(f"SQLite database not found at {sqlite_db_path}")

        import sqlite3
        conn = sqlite3.connect(sqlite_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # 1. Load faiss_id_map and temporary chunks_text_map
        temp_chunks_text_map = {}
        cursor.execute("SELECT chunk_id, embed_text, faiss_index FROM chunks")
        for row in cursor.fetchall():
            chunk_id = row["chunk_id"]
            temp_chunks_text_map[chunk_id] = row["embed_text"] or ""
            if row["faiss_index"] is not None:
                self.faiss_id_map[int(row["faiss_index"])] = chunk_id
                
        # 2. Load chunk_map
        cursor.execute("""
            SELECT c.chunk_id, c.article, c.clause, d.title, d.doc_num, d.doc_id,
                   d.effective_date, d.expiration_date, d.status
            FROM chunks c
            JOIN documents d ON c.doc_id = d.doc_id
        """)
        for row in cursor.fetchall():
            chunk_id = row["chunk_id"]
            self.chunk_map[chunk_id] = {
                "title": row["title"],
                "doc_num": row["doc_num"],
                "doc_id": row["doc_id"],
                "effective_date": row["effective_date"],
                "expiration_date": row["expiration_date"],
                "status": row["status"]
            }
            if row["article"]:
                self.chunk_map[chunk_id]["article"] = row["article"]
            if row["clause"]:
                self.chunk_map[chunk_id]["clause"] = row["clause"]
                
        # 3. Load article_index_map
        cursor.execute("""
            SELECT doc_id, article, faiss_index 
            FROM chunks 
            WHERE article IS NOT NULL AND faiss_index IS NOT NULL
        """)
        for row in cursor.fetchall():
            key = f"{row['doc_id']}|{row['article']}"
            self.article_index_map.setdefault(key, []).append(int(row["faiss_index"]))
            
        conn.close()
        print("Loaded database configuration from SQLite data.db successfully.")
            
        self._init_bm25(temp_chunks_text_map)

    def _init_bm25(self, temp_chunks_text_map):
        from rank_bm25 import BM25Okapi
        self.bm25_chunks = list(self.chunk_map.keys())
        corpus_tokens = []
        for cid in self.bm25_chunks:
            content = temp_chunks_text_map.get(cid, "")
            corpus_tokens.append(self._tokenize(content))
        self.bm25 = BM25Okapi(corpus_tokens)

    def _tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        return [w for w in re.findall(r'\w+', text.lower()) if w]

    def _get_chunk_content(self, chunk_id: str) -> str:
        """Lấy nội dung full của chunk từ SQLite."""
        sqlite_db_path = SQLITE_DATABASE_FILE
        if os.path.exists(sqlite_db_path):
            import sqlite3
            try:
                conn = sqlite3.connect(sqlite_db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT embed_text FROM chunks WHERE chunk_id = ?", (chunk_id,))
                row = cursor.fetchone()
                conn.close()
                if row:
                    return row[0] or ""
            except Exception as e:
                print(f"Error querying chunk content from SQLite: {e}")
        
        meta = self.chunk_map.get(chunk_id, {})
        parts = []
        if meta.get("title"): parts.append(meta["title"])
        if meta.get("article"): parts.append(meta["article"])
        if meta.get("content"): parts.append(meta["content"])
        return " | ".join(parts)
        
    def _is_superseded(self, chunk_id: str) -> bool:
        if not hasattr(self, 'graph_service'):
            from app.rag.knowledge_graph import GraphService
            self.graph_service = GraphService()
            self.graph_service.load_graph()
            
        g = self.graph_service.graph
        if not g.has_node(chunk_id):
            return False
            
        # 1. Check if chunk has incoming supersedes edge
        for u, v, d in g.in_edges(chunk_id, data=True):
            if d.get("type") == "supersedes":
                return True
                
        # 2. Check if parent Article has incoming supersedes edge
        meta = self.chunk_map.get(chunk_id, {})
        doc_num = meta.get("doc_num")
        article = meta.get("article")
        if doc_num and article:
            art_key = f"{doc_num}|{article}"
            if g.has_node(art_key):
                for u, v, d in g.in_edges(art_key, data=True):
                    if d.get("type") == "supersedes":
                        return True
                        
        # 3. Check if parent Document has incoming supersedes edge
        if doc_num and g.has_node(doc_num):
            for u, v, d in g.in_edges(doc_num, data=True):
                if d.get("type") == "supersedes":
                    return True
                    
        # 4. Fallback metadata check
        if meta.get("status") == "Hết hiệu lực":
            return True
            
        return False

    def semantic_search(self, query: str, top_k: int = 20, include_superseded: bool = False) -> List[Dict[str, Any]]:
        """
        Tìm kiếm kết hợp (Hybrid Search): Vector (FAISS) + BM25 xếp hạng bằng Reciprocal Rank Fusion (RRF),
        sau đó áp dụng Reranking. Loại bỏ các phần đã bị thay thế (superseded) nếu include_superseded=False.
        """
        # 1. Vector Search
        vec_results = []
        vec = self.chat_service.get_embedding(query)
        if vec:
            vec_np = np.array([vec], dtype=np.float32)
            scores, ids = self.index.search(vec_np, min(top_k * 4, self.index.ntotal))
            for score, faiss_idx in zip(scores[0], ids[0]):
                if faiss_idx < 0: continue
                chunk_id = self.faiss_id_map.get(int(faiss_idx))
                if chunk_id:
                    vec_results.append(chunk_id)

        # 2. BM25 Search
        query_tokens = self._tokenize(query)
        bm25_scores = self.bm25.get_scores(query_tokens)
        top_bm25_indices = np.argsort(bm25_scores)[::-1][:top_k * 4]
        bm25_results = [self.bm25_chunks[idx] for idx in top_bm25_indices if bm25_scores[idx] > 0]

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores = {}
        k_rrf = 60
        for rank, chunk_id in enumerate(vec_results):
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (k_rrf + rank + 1)
        for rank, chunk_id in enumerate(bm25_results):
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (k_rrf + rank + 1)

        # Sắp xếp theo RRF Score
        sorted_chunks = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:top_k * 4]

        # Lọc bỏ các chunk hết hiệu lực
        if not include_superseded:
            sorted_chunks = [cid for cid in sorted_chunks if not self._is_superseded(cid)]

        sorted_chunks = sorted_chunks[:top_k * 2]

        # Bulk query chunk contents to avoid multiple single connections
        chunk_contents = {}
        sqlite_db_path = SQLITE_DATABASE_FILE
        if os.path.exists(sqlite_db_path) and sorted_chunks:
            import sqlite3
            try:
                conn = sqlite3.connect(sqlite_db_path)
                cursor = conn.cursor()
                placeholders = ",".join("?" for _ in sorted_chunks)
                cursor.execute(f"SELECT chunk_id, embed_text FROM chunks WHERE chunk_id IN ({placeholders})", sorted_chunks)
                for row in cursor.fetchall():
                    chunk_contents[row[0]] = row[1] or ""
                conn.close()
            except Exception as e:
                print(f"Error bulk querying chunk contents from SQLite: {e}")

        candidates = []
        docs_text_for_rerank = []
        for chunk_id in sorted_chunks:
            meta = self.chunk_map.get(chunk_id, {})
            content = chunk_contents.get(chunk_id) or self._get_chunk_content(chunk_id)
            candidates.append({
                "chunk_id": chunk_id,
                "rrf_score": rrf_scores[chunk_id],
                "metadata": meta,
                "content": content
            })
            docs_text_for_rerank.append(content)

        if not candidates:
            return []

        # 4. Rerank
        rerank_scores = self.chat_service.get_rerank_scores(query, docs_text_for_rerank)
        for i, candidate in enumerate(candidates):
            candidate["rerank_score"] = rerank_scores[i]

        candidates.sort(key=lambda x: x["rerank_score"], reverse=True)

        # 5. Build final list
        final_results = []
        for item in candidates[:top_k]:
            final_results.append({
                "chunk_id": item["chunk_id"],
                "score": item["rerank_score"],
                "metadata": item["metadata"],
                "content": item["content"]
            })
        return final_results

    def doc_ref_search(
        self,
        query: str,
        doc_ref: str,
        article_filter: Optional[str] = None,
        clause_filter: Optional[str] = None,
        top_k: int = 10,
        include_superseded: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Tìm kiếm trong văn bản cụ thể (dùng cho tool).
        Hỗ trợ lọc theo Số hiệu, Điều, Khoản trước khi Semantic Rank.
        """
        extracted_doc_num = self._extract_doc_num(doc_ref)
        ref_norm = self._normalize_doc_ref(extracted_doc_num or doc_ref)
        
        # 1. Lọc chunk_map theo doc_ref
        matched_ids: List[str] = []
        
        # Ưu tiên match chính xác doc_num
        if extracted_doc_num:
            extracted_norm = self._normalize_doc_ref(extracted_doc_num)
            for chunk_id, meta in self.chunk_map.items():
                doc_num_norm = self._normalize_doc_ref(meta.get("doc_num", ""))
                if doc_num_norm == extracted_norm:
                    matched_ids.append(chunk_id)
        
        # Fallback match mờ nếu không tìm thấy
        if not matched_ids:
            for chunk_id, meta in self.chunk_map.items():
                doc_num_norm = self._normalize_doc_ref(meta.get("doc_num", ""))
                title_norm = self._normalize_doc_ref(meta.get("title", ""))
                if (ref_norm in doc_num_norm or ref_norm in title_norm or 
                    doc_num_norm in ref_norm or title_norm in ref_norm):
                    matched_ids.append(chunk_id)
                    
        if not matched_ids:
            return []
            
        # Lọc bỏ các chunk hết hiệu lực
        if not include_superseded:
            matched_ids = [cid for cid in matched_ids if not self._is_superseded(cid)]

        if not matched_ids:
            return []

        # 2. Lọc theo Điều/Khoản nếu có
        if article_filter:
            dieu_norm = self._normalize_doc_ref(article_filter)
            # Thử match key trong article_index_map trước
            doc_id = self.chunk_map[matched_ids[0]].get("doc_id")
            article_key = f"{doc_id}|{article_filter.strip()}"
            
            faiss_ids_for_article = self.article_index_map.get(article_key)
            if faiss_ids_for_article:
                ids_from_article = {
                    self.faiss_id_map[fid] for fid in faiss_ids_for_article 
                    if fid in self.faiss_id_map
                }
                matched_ids = [cid for cid in matched_ids if cid in ids_from_article]
            else:
                # Fallback scan metadata
                matched_ids = [
                    cid for cid in matched_ids 
                    if dieu_norm in self._normalize_doc_ref(self.chunk_map[cid].get("article", ""))
                ]
        
        if clause_filter:
            khoan_norm = self._normalize_doc_ref(clause_filter)
            matched_ids = [
                cid for cid in matched_ids 
                if khoan_norm in self._normalize_doc_ref(self.chunk_map[cid].get("clause", ""))
            ]
            
        if not matched_ids:
            return []
            
        # 3. Semantic Ranking trong tập đã lọc
        if len(matched_ids) > 1:
            vec = self.chat_service.get_embedding(query)
            if vec:
                vec_np = np.array([vec], dtype=np.float32)
                chunk_to_faiss = {v: k for k, v in self.faiss_id_map.items()}
                matched_faiss_ids = [chunk_to_faiss[cid] for cid in matched_ids if cid in chunk_to_faiss]
                
                if matched_faiss_ids:
                    k_search = min(len(matched_faiss_ids) + 5, self.index.ntotal)
                    scores, ids = self.index.search(vec_np, k_search)
                    
                    scored_matches = []
                    faiss_id_set = set(matched_faiss_ids)
                    
                    for score, fid in zip(scores[0], ids[0]):
                        if fid in faiss_id_set and float(score) >= self.threshold:
                            cid = self.faiss_id_map[int(fid)]
                            scored_matches.append((float(score), cid))
                    
                    scored_matches.sort(reverse=True)
                    matched_ids = [cid for _, cid in scored_matches[:top_k]]
        
        # 4. Build result
        results = []
        for cid in matched_ids[:top_k]:
            meta = self.chunk_map.get(cid, {})
            content = self._get_chunk_content(cid)
            results.append({
                "chunk_id": cid,
                "score": 1.0,
                "metadata": meta,
                "content": content,
                "source": "doc_ref_search"
            })
            
        return results

    def _normalize_doc_ref(self, text: str) -> str:
        if not text: return ""
        return re.sub(r'\s+', ' ', text.strip().lower())

    def _extract_doc_num(self, text: str) -> Optional[str]:
        if not text: return None
        match = re.search(
            r'\d+[A-Za-z]*\s*/\s*\d{4}\s*/\s*[A-ZĐƯƠ]+(?:-[A-ZĐƯƠ]+)*',
            text, flags=re.UNICODE
        )
        if not match: return None
        raw = match.group(0)
        return re.sub(r'\s*/\s*', '/', raw).strip()
