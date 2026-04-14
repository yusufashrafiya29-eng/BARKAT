import re
from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from backend.models.order import OrderStatus

class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = 1
    notes: Optional[str] = None

class OrderItemRead(BaseModel):
    id: UUID
    menu_item_id: UUID
    quantity: int
    price_at_order_time: float
    subtotal: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    table_id: UUID
    items: List[OrderItemCreate]
    customer_phone: Optional[str] = None
    source: str = "CUSTOMER"
    is_accepted: bool = False
    
    @field_validator('customer_phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            if not re.match(r'^\+[1-9]\d{1,14}$', v):
                raise ValueError('Phone number must be in E.164 format (e.g. +919876543210)')
        return v

class OrderRead(BaseModel):
    id: UUID
    table_id: UUID
    waiter_id: Optional[UUID] = None
    customer_phone: Optional[str] = None
    status: OrderStatus
    source: str
    is_accepted: bool
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemRead] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderUpdateItems(BaseModel):
    items: List[OrderItemCreate]
