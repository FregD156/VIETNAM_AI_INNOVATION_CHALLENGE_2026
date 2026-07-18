from __future__ import annotations

import sqlite3
from contextlib import closing
from typing import Any, Optional

import networkx as nx

from app.core.paths import SQLITE_DATABASE_FILE
from app.rag.effective_resolver import EffectiveResolver


class GraphService:
    def __init__(self, database_file: Optional[str] = None):
        self.database_file = database_file or str(SQLITE_DATABASE_FILE)
        self.graph = nx.DiGraph()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_file)
        connection.row_factory = sqlite3.Row
        return connection

    def build_graph(self) -> None:
        self.graph.clear()
        with closing(self._connect()) as connection:
            documents = connection.execute(
                """
                SELECT doc_id, document_uid, doc_num, title, issued_date,
                       effective_date, expiration_date, status, source_type,
                       source_url, is_synthetic, version, reviewed, review_level,
                       valid_from, valid_to
                FROM documents
                """
            ).fetchall()
            for document in documents:
                data = dict(document)
                self.graph.add_node(
                    document["doc_num"],
                    type="document",
                    label=document["title"] or document["doc_num"],
                    **data,
                )

            chunks = connection.execute(
                """
                SELECT c.chunk_id, c.doc_id, c.provision_id, c.version_id,
                       c.article, c.clause, c.point, c.embed_text,
                       c.valid_from, c.valid_to, c.reviewed, c.review_level,
                       d.doc_num, d.title, d.status, d.source_type,
                       d.source_url, d.is_synthetic, d.effective_date
                FROM chunks c JOIN documents d ON d.doc_id = c.doc_id
                ORDER BY c.faiss_index
                """
            ).fetchall()
            for chunk in chunks:
                doc_num = chunk["doc_num"]
                article_key = f"{doc_num}|{chunk['article']}"
                if not self.graph.has_node(article_key):
                    self.graph.add_node(
                        article_key,
                        type="article",
                        label=chunk["article"],
                        article=chunk["article"],
                        doc_num=doc_num,
                    )
                    self.graph.add_edge(doc_num, article_key, type="contains")

                data = dict(chunk)
                self.graph.add_node(
                    chunk["chunk_id"],
                    type="clause",
                    label=chunk["clause"] or chunk["article"],
                    content=chunk["embed_text"],
                    **{key: value for key, value in data.items() if key != "embed_text"},
                )
                self.graph.add_edge(article_key, chunk["chunk_id"], type="contains")

            relations = connection.execute(
                """
                SELECT source_chunk_id, target_chunk_id, relation_type, scope,
                       effective_from, effective_to, status, evidence_text
                FROM provision_relations WHERE status = 'reviewed'
                ORDER BY id
                """
            ).fetchall()
            for relation in relations:
                source = relation["source_chunk_id"]
                target = relation["target_chunk_id"]
                if self.graph.has_node(source) and self.graph.has_node(target):
                    self.graph.add_edge(
                        source,
                        target,
                        **{
                            key: value
                            for key, value in dict(relation).items()
                            if key not in {"source_chunk_id", "target_chunk_id"}
                        },
                        type=relation["relation_type"],
                    )

    def load_graph(self) -> None:
        self.build_graph()

    def get_related_nodes(self, chunk_id: str) -> dict[str, list[dict[str, Any]]]:
        if not self.graph:
            self.load_graph()
        result = {
            "references": [],
            "supersedes": [],
            "superseded_by": [],
            "conflicts_with": [],
        }
        if not self.graph.has_node(chunk_id):
            return result
        for _, target, edge in self.graph.out_edges(chunk_id, data=True):
            relation_type = edge.get("type")
            if relation_type in result:
                result[relation_type].append(self._related_payload(target, edge))
        for source, _, edge in self.graph.in_edges(chunk_id, data=True):
            if edge.get("type") == "supersedes":
                result["superseded_by"].append(self._related_payload(source, edge))
        return result

    def expand_evidence(
        self,
        documents: list[dict[str, Any]],
        as_of: Optional[str] = None,
        max_hops: int = 1,
        node_budget: int = 8,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """Deterministically expand reviewed graph relations server-side."""
        if not self.graph:
            self.load_graph()
        resolver = EffectiveResolver(self.database_file)
        seen = {item.get("chunk_id") for item in documents}
        frontier = [(item.get("chunk_id"), 0, [item.get("chunk_id")]) for item in documents]
        additions: list[dict[str, Any]] = []
        trace: list[dict[str, Any]] = []
        allowed = {"references", "amends", "conflicts_with", "supersedes"}

        while frontier and len(additions) < node_budget:
            current, depth, path = frontier.pop(0)
            if not current or depth >= max_hops or not self.graph.has_node(current):
                continue
            candidates: list[tuple[str, dict[str, Any], str]] = []
            for _, target, edge in self.graph.out_edges(current, data=True):
                if edge.get("type") in allowed:
                    candidates.append((target, edge, "outgoing"))
            for source, _, edge in self.graph.in_edges(current, data=True):
                if edge.get("type") == "supersedes":
                    candidates.append((source, edge, "incoming"))

            for target, edge, direction in candidates:
                if target in seen or not self.graph.has_node(target):
                    continue
                node = self.graph.nodes[target]
                if node.get("type") != "clause":
                    continue
                validity = resolver.resolve(target, as_of)
                entry = {
                    "from": current,
                    "to": target,
                    "relation_type": edge.get("type"),
                    "direction": direction,
                    "path": [*path, target],
                    "included": validity["is_effective"],
                    "reason": validity["reason"],
                    "evidence_text": edge.get("evidence_text", ""),
                }
                trace.append(entry)
                seen.add(target)
                if not validity["is_effective"]:
                    for successor in validity.get("replacement_path", [])[1:]:
                        if successor in seen or not self.graph.has_node(successor):
                            continue
                        successor_node = self.graph.nodes[successor]
                        successor_validity = resolver.resolve(successor, as_of)
                        successor_entry = {
                            "from": target,
                            "to": successor,
                            "relation_type": "resolved_to_successor",
                            "direction": "temporal",
                            "path": [*path, target, successor],
                            "included": successor_validity["is_effective"],
                            "reason": successor_validity["reason"],
                            "evidence_text": validity["reason"],
                        }
                        trace.append(successor_entry)
                        seen.add(successor)
                        if successor_validity["is_effective"]:
                            additions.append(
                                self._document_from_node(
                                    successor,
                                    successor_node,
                                    {"type": "resolved_to_successor", "evidence_text": validity["reason"]},
                                    successor_entry["path"],
                                )
                            )
                            frontier.append((successor, depth + 1, successor_entry["path"]))
                        if len(additions) >= node_budget:
                            break
                    continue
                additions.append(self._document_from_node(target, node, edge, entry["path"]))
                frontier.append((target, depth + 1, entry["path"]))
                if len(additions) >= node_budget:
                    break
        return additions, trace

    def get_subgraph(self, chunk_ids: list[str]) -> dict[str, Any]:
        if not self.graph:
            self.load_graph()
        nodes_to_keep: set[str] = set()
        for chunk_id in chunk_ids:
            if not self.graph.has_node(chunk_id):
                continue
            nodes_to_keep.add(chunk_id)
            for source, target, _ in self.graph.out_edges(chunk_id, data=True):
                nodes_to_keep.update((source, target))
            for source, target, _ in self.graph.in_edges(chunk_id, data=True):
                nodes_to_keep.update((source, target))
            node = self.graph.nodes[chunk_id]
            doc_num = node.get("doc_num")
            article = node.get("article")
            if doc_num:
                nodes_to_keep.add(doc_num)
                if article:
                    nodes_to_keep.add(f"{doc_num}|{article}")
        return nx.node_link_data(self.graph.subgraph(nodes_to_keep))

    def _related_payload(self, node_id: str, edge: dict[str, Any]) -> dict[str, Any]:
        node = self.graph.nodes[node_id]
        return {
            "node_id": node_id,
            "type": node.get("type"),
            "label": node.get("label"),
            "relation_type": edge.get("type"),
            "evidence_text": edge.get("evidence_text", ""),
        }

    @staticmethod
    def _document_from_node(
        chunk_id: str,
        node: dict[str, Any],
        edge: dict[str, Any],
        path: list[str],
    ) -> dict[str, Any]:
        metadata_keys = (
            "doc_id",
            "doc_num",
            "title",
            "article",
            "clause",
            "point",
            "effective_date",
            "status",
            "source_type",
            "source_url",
            "is_synthetic",
            "review_level",
        )
        return {
            "chunk_id": chunk_id,
            "content": node.get("content", ""),
            "score": 0.0,
            "metadata": {key: node.get(key) for key in metadata_keys},
            "retrieval_origin": "graph",
            "relation_type": edge.get("type"),
            "relation_path": path,
            "relation_reason": edge.get("evidence_text", ""),
        }
