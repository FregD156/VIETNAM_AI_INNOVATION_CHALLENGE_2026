import asyncio

from fastapi import APIRouter, Request


router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("/benchmark")
async def evaluation_benchmark(request: Request):
    return await asyncio.to_thread(request.app.state.benchmark_service.run)
