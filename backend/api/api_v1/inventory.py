from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.inventory import StockItemCreate, StockItemRead, StockAdjustment
from services import inventory_service

router = APIRouter()

@router.get("/", response_model=List[StockItemRead])
def get_inventory(
    active_only: bool = True, 
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """List current stock securely."""
    return inventory_service.get_all_stock(db, active_only, str(restaurant_id))

@router.post("/", response_model=StockItemRead)
def create_stock(
    item_in: StockItemCreate, 
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Add a new raw ingredient to track."""
    return inventory_service.create_stock_item(db, item_in, str(restaurant_id))

@router.put("/{item_id}/adjust", response_model=StockItemRead)
def adjust_stock(
    item_id: UUID, 
    adjustment: StockAdjustment, 
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Manually add or remove quantity (e.g., used 5kg of flour -> pass -5 in payload)."""
    return inventory_service.adjust_stock(db, item_id, adjustment.quantity_change, str(restaurant_id))
