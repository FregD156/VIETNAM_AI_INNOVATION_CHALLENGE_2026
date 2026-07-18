import os
import re
import networkx as nx
from typing import List, Dict, Any
from app.core.paths import SQLITE_DATABASE_FILE

class GraphService:
    def __init__(self):
        self.graph = nx.DiGraph()
        
    def build_graph(self):
        self.graph.clear()
        import sqlite3
        sqlite_db_path = str(SQLITE_DATABASE_FILE)
        if not os.path.exists(sqlite_db_path):
            print("SQLite data.db not found, cannot build graph.")
            return

        conn = sqlite3.connect(sqlite_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Fetch documents
        cursor.execute("SELECT doc_id, doc_num, title, effective_date, expiration_date, status FROM documents")
        docs = cursor.fetchall()
        for doc in docs:
            doc_num = doc["doc_num"]
            self.graph.add_node(
                doc_num,
                type="document",
                label=doc["title"] or doc_num,
                doc_num=doc_num,
                effective_date=doc["effective_date"],
                expiration_date=doc["expiration_date"],
                status=doc["status"]
            )

        # 2. Fetch chunks (clauses)
        cursor.execute("""
            SELECT c.chunk_id, c.doc_id, c.article, c.clause, c.embed_text, d.doc_num, d.title, d.effective_date, d.expiration_date, d.status
            FROM chunks c
            JOIN documents d ON c.doc_id = d.doc_id
        """)
        chunks = cursor.fetchall()
        for chunk in chunks:
            chunk_id = chunk["chunk_id"]
            doc_num = chunk["doc_num"]
            article = chunk["article"]
            clause = chunk["clause"]

            # Article Node
            art_key = f"{doc_num}|{article}" if article else None
            if art_key and not self.graph.has_node(art_key):
                self.graph.add_node(art_key, type="article", label=article, article=article, doc_num=doc_num)
                self.graph.add_edge(doc_num, art_key, type="contains")

            # Clause Node
            self.graph.add_node(
                chunk_id,
                type="clause",
                label=clause or article or chunk_id,
                clause=clause,
                article=article,
                doc_num=doc_num,
                content=chunk["embed_text"],
                effective_date=chunk["effective_date"],
                expiration_date=chunk["expiration_date"],
                status=chunk["status"]
            )

            if art_key:
                self.graph.add_edge(art_key, chunk_id, type="contains")
            else:
                self.graph.add_edge(doc_num, chunk_id, type="contains")

        # 3. Add relational edges from SQLite
        # A. Supersedes relation
        cursor.execute("SELECT source_chunk_id, target_doc_num, target_article, target_clause FROM supersedes_relations")
        for rel in cursor.fetchall():
            chunk_id = rel["source_chunk_id"]
            target_doc = rel["target_doc_num"]
            target_art = rel["target_article"]

            target_node = None
            if target_doc:
                if target_art:
                    target_node = f"{target_doc}|{target_art}"
                else:
                    target_node = target_doc

            if target_node and self.graph.has_node(target_node):
                self.graph.add_edge(chunk_id, target_node, type="supersedes")

        # B. References relation
        cursor.execute("SELECT source_chunk_id, target_doc_num FROM references_relations")
        for rel in cursor.fetchall():
            chunk_id = rel["source_chunk_id"]
            ref_doc = rel["target_doc_num"]
            text = self.graph.nodes[chunk_id].get("content", "")

            # Match e.g. "Điều 8 Thông tư 39" or similar
            art_match = re.search(r'Điều\s+(\w+)\s+[^.\n]*?' + re.escape(ref_doc.split('/')[0]), text, re.IGNORECASE)
            target_node = ref_doc
            if art_match:
                possible_art_key = f"{ref_doc}|Điều {art_match.group(1)}"
                if self.graph.has_node(possible_art_key):
                    target_node = possible_art_key

            if self.graph.has_node(target_node):
                self.graph.add_edge(chunk_id, target_node, type="references")

        conn.close()

    def save_graph(self):
        # Since SQLite is the only storage, we don't save to JSON.
        pass

    def load_graph(self):
        # Dynamically build graph from SQLite
        self.build_graph()
            
    def get_related_nodes(self, chunk_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Finds references and supersedes connections for a given chunk."""
        if not self.graph.has_node(chunk_id):
            return {"references": [], "supersedes": [], "superseded_by": []}
            
        references = []
        supersedes = []
        superseded_by = []
        
        # Outgoing edges from chunk_id
        for u, v, d in self.graph.out_edges(chunk_id, data=True):
            edge_type = d.get("type")
            node_data = self.graph.nodes[v]
            if edge_type == "references":
                references.append({"node_id": v, "type": node_data.get("type"), "label": node_data.get("label")})
            elif edge_type == "supersedes":
                supersedes.append({"node_id": v, "type": node_data.get("type"), "label": node_data.get("label")})
                
        # Incoming edges to chunk_id
        for u, v, d in self.graph.in_edges(chunk_id, data=True):
            edge_type = d.get("type")
            node_data = self.graph.nodes[u]
            if edge_type == "supersedes":
                superseded_by.append({"node_id": u, "type": node_data.get("type"), "label": node_data.get("label")})
                
        return {"references": references, "supersedes": supersedes, "superseded_by": superseded_by}

    def get_subgraph(self, chunk_ids: List[str]) -> Dict[str, Any]:
        """Trích xuất một đồ thị con cảm ứng (induced subgraph) dựa trên danh sách chunk_id."""
        if not self.graph:
            self.load_graph()
            
        nodes_to_keep = set()
        for cid in chunk_ids:
            if self.graph.has_node(cid):
                nodes_to_keep.add(cid)
                
                # Thêm các nút có liên kết đi (references / supersedes)
                for u, v, d in self.graph.out_edges(cid, data=True):
                    nodes_to_keep.add(v)
                    
                # Thêm các nút có liên kết đến
                for u, v, d in self.graph.in_edges(cid, data=True):
                    nodes_to_keep.add(u)
                    
                # Thêm các nút phân cấp cha (Article và Document)
                meta = self.graph.nodes[cid]
                doc_num = meta.get("doc_num")
                article = meta.get("article")
                if doc_num:
                    nodes_to_keep.add(doc_num)
                    if article:
                        art_key = f"{doc_num}|{article}"
                        nodes_to_keep.add(art_key)
                        
        # Tạo đồ thị con cảm ứng
        sub_g = self.graph.subgraph(nodes_to_keep)
        
        # Chuyển đổi sang định dạng node-link của NetworkX
        data = nx.node_link_data(sub_g)
        return data
