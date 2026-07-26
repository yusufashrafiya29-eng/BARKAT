from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from models.billing import PaymentMethod, PaymentStatus

from typing import List

class PaymentTransactionRead(BaseModel):
    id: UUID
    amount: float
    payment_method: str
    transaction_reference: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    payment_method: PaymentMethod = PaymentMethod.CASH
    discount_amount: float = 0.0

class BillCreate(BillBase):
    pass

class PaymentConfirmation(BaseModel):
    amount: float
    payment_method: str
    transaction_reference: Optional[str] = None

class BillRead(BaseModel):
    id: UUID
    order_id: UUID
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    amount_paid: float
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    transactions: List[PaymentTransactionRead] = []
    created_at: datetime

    class Config:
        from_attributes = True
