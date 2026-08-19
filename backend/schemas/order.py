import re
from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from models.order import OrderStatus

class TableSimpleRead(BaseModel):
    id: UUID
    table_number: int
    class Config:
        from_attributes = True

class MenuItemSimpleRead(BaseModel):
    id: UUID
    name: str
    class Config:
        from_attributes = True

class OrderItemModifierBase(BaseModel):
    modifier_id: UUID

class OrderItemModifierCreate(OrderItemModifierBase):
    pass

class ModifierSimpleRead(BaseModel):
    name: str
    price: float
    
    class Config:
        from_attributes = True

class OrderItemModifierRead(OrderItemModifierBase):
    id: UUID
    order_item_id: UUID
    price_at_order_time: float
    modifier: Optional[ModifierSimpleRead] = None
    
    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = 1
    notes: Optional[str] = None
    is_parcel: bool = False
    modifiers: List[OrderItemModifierCreate] = []

class OrderItemRead(BaseModel):
    id: UUID
    menu_item_id: UUID
    quantity: int
    price_at_order_time: float
    subtotal: float
    notes: Optional[str] = None
    status: str = "PENDING"
    is_parcel: bool = False
    modifiers: List[OrderItemModifierRead] = []
    menu_item: Optional[MenuItemSimpleRead] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    restaurant_id: Optional[UUID] = None
    table_id: Optional[UUID] = None
    order_type: str = "DINE_IN"
    items: List[OrderItemCreate]
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    guests_count: Optional[int] = None
    counter_name: str = "Main Register"
    source: str = "CUSTOMER"
    tip_amount: float = 0.0
    status: Optional[str] = None
    is_accepted: bool = False
    
    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, v):
        if v:
            return re.sub(r"[^\+0-9]", "", v)
        return v

class OrderRead(BaseModel):
    id: UUID
    restaurant_id: UUID
    table_id: Optional[UUID] = None
    table: Optional[TableSimpleRead] = None
    order_type: str
    waiter_id: Optional[UUID] = None
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    guests_count: Optional[int] = None
    counter_name: str
    status: OrderStatus
    source: str
    is_accepted: bool
    payment_status: str
    subtotal_amount: float
    tax_amount: float
    tip_amount: float
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemRead] = []
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class PaymentStatusUpdate(BaseModel):
    payment_status: str

class OrderUpdateItems(BaseModel):
    items: List[OrderItemCreate]
    status: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    guests_count: Optional[int] = None
    tip_amount: Optional[float] = None

class OrderItemStatusUpdate(BaseModel):
    status: str

class OrderUpdateCustomer(BaseModel):
    customer_name: str
    customer_phone: str

class ClearHistoryRequest(BaseModel):
    password: str

class AggregatorOrderResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    platform: str
    platform_order_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items_summary: Optional[str] = None
    raw_payload: Optional[Any] = None
    gross_amount: float
    platform_commission_rate: float
    ad_deduction: float
    gst_on_commission: float
    net_payout: float
    status: str
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None
    rider_status: str
    eta: Optional[str] = None
    ordered_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
