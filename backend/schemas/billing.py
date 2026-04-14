from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from models.billing import PaymentMethod, PaymentStatus

class BillBase(BaseModel):
    payment_method: PaymentMethod = PaymentMethod.CASH
    discount_amount: float = 0.0

class BillCreate(BillBase):
    pass

class PaymentConfirmation(BaseModel):
    transaction_id: Optional[str] = None

class BillRead(BaseModel):
    id: UUID
    order_id: UUID
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
