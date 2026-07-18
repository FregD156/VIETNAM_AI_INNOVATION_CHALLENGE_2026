import asyncio
import json
import queue
import threading
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app.api.schemas.chat import ChatRequest
from app.integrations.llm_client import get_available_chat_models
from app.rag.knowledge_graph import GraphService


router = APIRouter(tags=["chat"])
_SENTINEL = object()


def _attach_evidence_graph(payload: dict[str, Any]) -> None:
    citations = payload.get("citations", {})
    chunk_ids = [
        citation["chunk_id"]
        for citation in citations.values()
        if "chunk_id" in citation
    ]
    if not chunk_ids:
        payload["graph"] = {"nodes": [], "links": []}
        return

    try:
        payload["graph"] = GraphService().get_subgraph(chunk_ids)
    except Exception as error:
        print(f"Không thể trích xuất đồ thị bằng chứng: {error}")
        payload["graph"] = {"nodes": [], "links": []}


def _run_pipeline_in_thread(
    pipeline,
    conversation: list[dict],
    stream: bool,
    output_queue: queue.Queue,
    model: str | None = None,
) -> None:
    """Run blocking model calls outside the ASGI event loop."""
    try:
        for event in pipeline.process(
            messages=conversation,
            stream=stream,
            model=model,
        ):
            output_queue.put(event)
    except Exception as error:
        output_queue.put(
            {"step": "answer", "status": "error", "data": {"error": str(error)}}
        )
    finally:
        output_queue.put(_SENTINEL)


async def _stream_events(pipeline, conversation: list[dict], model: str | None):
    output_queue: queue.Queue = queue.Queue()
    threading.Thread(
        target=_run_pipeline_in_thread,
        args=(pipeline, conversation, True, output_queue, model),
        daemon=True,
    ).start()
    loop = asyncio.get_running_loop()

    try:
        while True:
            event = await loop.run_in_executor(None, output_queue.get)
            if event is _SENTINEL:
                break
            if event.get("step") == "answer" and event.get("status") == "done":
                _attach_evidence_graph(event.setdefault("data", {}))
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as error:
        event = {
            "step": "answer",
            "status": "error",
            "data": {"error": str(error)},
        }
        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _empty_response() -> dict[str, Any]:
    return {
        "steps": [],
        "final_answer": "",
        "citations": {},
        "sources": [],
        "conflicts": [],
        "conflict_status": "not_evaluated",
        "citation_warnings": [],
        "graph": {"nodes": [], "links": []},
    }


@router.post("/chat")
async def chat_endpoint(request: Request, payload: ChatRequest):
    if not payload.messages:
        return JSONResponse(
            status_code=400,
            content={"error": "messages không được để trống."},
        )

    available_model_ids = {
        model["id"] for model in get_available_chat_models()
    }
    if payload.model and payload.model not in available_model_ids:
        return JSONResponse(
            status_code=400,
            content={"error": "Mô hình không khả dụng hoặc chưa được cấu hình."},
        )

    conversation = [message.model_dump() for message in payload.messages]
    pipeline = request.app.state.pipeline
    if payload.stream:
        return StreamingResponse(
            _stream_events(pipeline, conversation, payload.model),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    def run_non_stream():
        return list(
            pipeline.process(
                messages=conversation,
                stream=False,
                model=payload.model,
            )
        )

    try:
        steps = await asyncio.get_running_loop().run_in_executor(None, run_non_stream)
        response = _empty_response()
        response["steps"] = steps
        for event in steps:
            if event.get("status") == "error":
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": event.get("data", {}).get(
                            "error",
                            "Lỗi pipeline",
                        )
                    },
                )
            if event.get("step") != "answer" or event.get("status") != "done":
                continue
            data = event.get("data", {})
            response.update(
                {
                    "final_answer": data.get("text", ""),
                    "citations": data.get("citations", {}),
                    "sources": data.get("sources", []),
                    "conflicts": data.get("conflicts", []),
                    "conflict_status": data.get(
                        "conflict_status",
                        "not_evaluated",
                    ),
                    "citation_warnings": data.get("citation_warnings", []),
                }
            )
        _attach_evidence_graph(response)
        return JSONResponse(content=response)
    except Exception as error:
        return JSONResponse(status_code=500, content={"error": str(error)})
