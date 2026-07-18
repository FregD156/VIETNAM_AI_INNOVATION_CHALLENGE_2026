import os
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import chat, documents, evaluation, graph, health
from app.core.config import FRONTEND_DIST_DIR, env_enabled
from app.rag.pipeline import RAGPipeline
from app.services.benchmark_service import BenchmarkService
from app.services.document_service import DocumentService
from app.services.ingestion_service import IngestionService


def _start_model_warmup(app: FastAPI) -> None:
    def warmup_loop():
        time.sleep(2)
        while True:
            pipeline = app.state.pipeline
            try:
                pipeline.chat_service.get_embedding("warmup")
                print("[Warmup] Embedding model đã sẵn sàng.")
            except Exception as error:
                print(f"[Warmup] Không thể warmup embedding: {error}")
            try:
                list(
                    pipeline.chat_service.generate_response(
                        [{"role": "user", "content": "ping"}],
                        stream=False,
                    )
                )
                print("[Warmup] LLM đã sẵn sàng.")
            except Exception as error:
                print(f"[Warmup] Không thể warmup LLM: {error}")
            time.sleep(int(os.getenv("MODEL_WARMUP_INTERVAL_SECONDS", "240")))

    threading.Thread(target=warmup_loop, daemon=True).start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pipeline = RAGPipeline()
    app.state.document_service = DocumentService()
    app.state.ingestion_service = IngestionService()
    app.state.benchmark_service = BenchmarkService()
    if env_enabled("ENABLE_MODEL_WARMUP"):
        _start_model_warmup(app)
    yield


def create_app() -> FastAPI:
    application = FastAPI(title="SHB Legal Intelligence API", lifespan=lifespan)
    application.include_router(health.router)
    application.include_router(chat.router)
    application.include_router(graph.router)
    application.include_router(documents.router)
    application.include_router(evaluation.router)

    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.is_dir():
        application.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @application.get("/favicon.svg", include_in_schema=False)
    async def favicon():
        favicon_file = FRONTEND_DIST_DIR / "favicon.svg"
        if not favicon_file.is_file():
            return {"message": "Frontend favicon chưa được build."}
        return FileResponse(favicon_file, media_type="image/svg+xml")

    @application.get("/", include_in_schema=False)
    async def read_root():
        index_file = FRONTEND_DIST_DIR / "index.html"
        if not index_file.is_file():
            return {
                "message": "Frontend chưa được build. Chạy npm run build trong frontend/."
            }
        return FileResponse(index_file)

    return application


app = create_app()
