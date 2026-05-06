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

from sqlalchemy.orm import Session
from fastapi import Depends
from api.deps import get_db
from models.settings import PlatformConfig
from schemas.superadmin import PlatformSettingResponse
from typing import List

@router.get("/platform-settings", response_model=List[PlatformSettingResponse])
def get_public_platform_settings(db: Session = Depends(get_db)):
    """Fetch public platform settings like pricing and trial length."""
    return db.query(PlatformConfig).all()
