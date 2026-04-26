from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from uuid import UUID

class ReservationBase(BaseModel):
    table_id: Optional[UUID] = None
    customer_name: str
    customer_phone: str
    reservation_date: date
    reservation_time: time
    guest_count: int

class ReservationCreateManual(ReservationBase):
    pass # Staff creates it without Razorpay

class ReservationCreatePublic(ReservationBase):
    pass # Customers create it

class ReservationStatusUpdate(BaseModel):
    status: str # PENDING, CONFIRMED, CANCELLED, COMPLETED
    table_id: Optional[UUID] = None # Optionally assign table when confirming

class ReservationRead(ReservationBase):
    id: UUID
    restaurant_id: UUID
    status: str
    payment_status: str
    advance_amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True
