from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Check if the API is running correctly.
    """
    return {
        "status": "ok", 
        "message": "Smart Restaurant API is healthy and running!"
    }
