from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from api.deps import get_db, get_current_user_token
from schemas.inventory import StockItemCreate, StockItemRead, StockAdjustment
from services import inventory_service

router = APIRouter()

@router.get("/", response_model=List[StockItemRead])
def get_inventory(
    active_only: bool = True, 
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """List current stock securely."""
    return inventory_service.get_all_stock(db, active_only)

@router.post("/", response_model=StockItemRead)
def create_stock(
    item_in: StockItemCreate, 
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """Add a new raw ingredient to track."""
    return inventory_service.create_stock_item(db, item_in)

@router.put("/{item_id}/adjust", response_model=StockItemRead)
def adjust_stock(
    item_id: UUID, 
    adjustment: StockAdjustment, 
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """Manually add or remove quantity (e.g., used 5kg of flour -> pass -5 in payload)."""
    return inventory_service.adjust_stock(db, item_id, adjustment.quantity_change)
