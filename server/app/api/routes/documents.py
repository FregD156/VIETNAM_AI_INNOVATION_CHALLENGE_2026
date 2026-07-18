import asyncio

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from app.api.schemas.documents import AdminUploadRequest
from app.rag.pipeline import RAGPipeline
from app.services.ingestion_service import IngestionBusyError, IngestionError


router = APIRouter(prefix="/admin", tags=["documents"])


@router.get("/stats")
async def admin_stats(request: Request):
    return request.app.state.document_service.get_stats()


@router.get("/documents")
async def admin_documents(
    request: Request,
    limit: int = Query(6, ge=1, le=50),
    offset: int = Query(0, ge=0),
    q: str = Query("", max_length=200),
):
    return request.app.state.document_service.list_documents(
        limit=limit,
        offset=offset,
        query_text=q,
    )


@router.get("/documents/{doc_id}")
async def admin_document_detail(
    request: Request,
    doc_id: str,
    chunk_limit: int = Query(12, ge=1, le=50),
    chunk_offset: int = Query(0, ge=0),
):
    document = request.app.state.document_service.get_document(
        doc_id,
        chunk_limit,
        chunk_offset,
    )
    if document is None:
        return JSONResponse(status_code=404, content={"error": "Không tìm thấy tài liệu."})
    return document


@router.get("/chunks/{chunk_id}")
async def admin_chunk_detail(request: Request, chunk_id: str):
    chunk = request.app.state.document_service.get_chunk(chunk_id)
    if chunk is None:
        return JSONResponse(status_code=404, content={"error": "Không tìm thấy điều khoản."})
    return chunk


@router.post("/documents")
async def admin_upload_document(request: Request, payload: AdminUploadRequest):
    try:
        result = await asyncio.to_thread(
            request.app.state.ingestion_service.ingest_markdown,
            payload.filename,
            payload.content,
        )
        # Swap only after a new pipeline has loaded the rebuilt artifacts.
        request.app.state.pipeline = await asyncio.to_thread(RAGPipeline)
        return JSONResponse(status_code=201, content=result)
    except IngestionBusyError as error:
        return JSONResponse(status_code=409, content={"error": str(error)})
    except IngestionError as error:
        return JSONResponse(status_code=400, content={"error": str(error)})
