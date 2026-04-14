from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db, get_current_user_token
from schemas.settings import UPIConfig
from services import settings_service

router = APIRouter()

@router.get("/upi", response_model=UPIConfig)
def get_upi_id(db: Session = Depends(get_db)):
    """Fetch the store's configured UPI ID."""
    upi_id = settings_service.get_config_value(db, "upi_id")
    if not upi_id:
        return {"upi_id": ""}
    return {"upi_id": upi_id}

@router.post("/upi", response_model=UPIConfig)
def update_upi_id(
    config_in: UPIConfig,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """(Secure) Update the store's UPI ID. Owner only."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    settings_service.set_config_value(db, "upi_id", config_in.upi_id)
    return {"upi_id": config_in.upi_id}
