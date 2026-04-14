from fastapi import APIRouter
from api.api_v1.router import api_router as api_v1_router

main_router = APIRouter()

main_router.include_router(api_v1_router, prefix="/api/v1")
