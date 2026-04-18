from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from models.inventory import StockItem
from schemas.inventory import StockItemCreate

def get_all_stock(db: Session, active_only: bool, restaurant_id: str):
    query = db.query(StockItem).filter(StockItem.restaurant_id == restaurant_id)
    if active_only:
        query = query.filter(StockItem.is_active == True)
    return query.order_by(StockItem.name).all()

def create_stock_item(db: Session, item_in: StockItemCreate, restaurant_id: str) -> StockItem:
    obj = StockItem(**item_in.model_dump(), restaurant_id=restaurant_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def adjust_stock(db: Session, item_id: UUID, quantity_change: float, restaurant_id: str) -> StockItem:
    obj = db.query(StockItem).filter(StockItem.id == item_id, StockItem.restaurant_id == restaurant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    # Simple atomic adjust - can handle both positive (restock) and negative (usage)
    obj.quantity += quantity_change
    db.commit()
    db.refresh(obj)
    return obj
