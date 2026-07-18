from fastapi import APIRouter

from app.integrations.llm_client import get_available_chat_models


router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.get("/models")
async def available_models():
    return {"models": get_available_chat_models()}
