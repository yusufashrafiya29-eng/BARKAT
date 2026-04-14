from fastapi import APIRouter

main_router = APIRouter()

@main_router.get("/test")
def test_api():
    return {"message": "API working 🔥"}

@main_router.get("/db-test")
def db_test():
    return {"db": "connected"}

# from fastapi import APIRouter
# from api.api_v1.router import api_router as api_v1_router

# main_router = APIRouter()

# main_router.include_router(api_v1_router, prefix="/api/v1")
