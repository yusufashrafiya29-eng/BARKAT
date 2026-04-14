from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class StockItemBase(BaseModel):
    name: str
    quantity: float = 0.0
    unit: str
    minimum_threshold: float = 0.0
    cost_price: float = 0.0
    is_active: bool = True

class StockItemCreate(StockItemBase):
    pass

class StockItemRead(StockItemBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    quantity_change: float
