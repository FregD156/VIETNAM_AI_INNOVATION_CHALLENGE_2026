from typing import Optional

import networkx as nx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.rag.knowledge_graph import GraphService


router = APIRouter(tags=["knowledge-graph"])


@router.get("/graph")
async def get_graph(doc_num: Optional[str] = None):
    try:
        graph_service = GraphService()
        graph_service.load_graph()
        data = nx.node_link_data(graph_service.graph)
    except Exception as error:
        print(f"Failed to load graph: {error}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to load graph: {error}"},
        )

    if not doc_num:
        return JSONResponse(content=data)

    requested_doc = doc_num.upper()
    nodes_to_keep = {
        node["id"]
        for node in data.get("nodes", [])
        if node.get("id", "").upper() == requested_doc
        or node.get("doc_num", "").upper() == requested_doc
    }
    links_to_keep = []
    for link in data.get("links", []):
        source = link["source"]
        target = link["target"]
        if source in nodes_to_keep or target in nodes_to_keep:
            nodes_to_keep.update({source, target})
            links_to_keep.append(link)

    filtered_nodes = [
        node for node in data.get("nodes", []) if node["id"] in nodes_to_keep
    ]
    return JSONResponse(content={"nodes": filtered_nodes, "links": links_to_keep})
