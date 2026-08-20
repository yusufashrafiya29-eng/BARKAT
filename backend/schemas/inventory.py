from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class StockItemBase(BaseModel):
    name: str = Field(..., min_length=1)
    quantity: float = Field(default=0.0, ge=0.0)
    unit: str = Field(..., min_length=1)
    minimum_threshold: float = Field(default=0.0, ge=0.0)
    cost_price: float = Field(default=0.0, ge=0.0)
    is_active: bool = True

class StockItemCreate(StockItemBase):
    pass

class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    minimum_threshold: Optional[float] = None
    cost_price: Optional[float] = None
    is_active: Optional[bool] = None

class StockItemRead(StockItemBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    quantity_change: float
