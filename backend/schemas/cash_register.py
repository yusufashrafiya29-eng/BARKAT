from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from models.cash_register import ShiftStatus, TransactionType


# ── Transaction Schemas ────────────────────────────────────────────────────────
class CashTransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    description: Optional[str] = None


class CashTransactionRead(BaseModel):
    id: UUID
    shift_id: UUID
    type: TransactionType
    amount: float
    description: Optional[str] = None
    created_at: datetime
    created_by: UUID

    class Config:
        from_attributes = True


# ── Shift Schemas ──────────────────────────────────────────────────────────────
class OpenShiftRequest(BaseModel):
    opening_balance: float


class CloseShiftRequest(BaseModel):
    closing_balance: float  # physically counted amount
    notes: Optional[str] = None


class CashShiftRead(BaseModel):
    id: UUID
    restaurant_id: UUID
    opened_by: UUID
    closed_by: Optional[UUID] = None
    opening_balance: float
    closing_balance: Optional[float] = None
    expected_balance: Optional[float] = None
    net_sales: float
    total_cash_in: float
    total_cash_out: float
    status: ShiftStatus
    notes: Optional[str] = None
    opened_at: datetime
    closed_at: Optional[datetime] = None
    transactions: List[CashTransactionRead] = []

    class Config:
        from_attributes = True


class ShiftSummary(BaseModel):
    """Lightweight version for shift history list."""
    id: UUID
    opening_balance: float
    closing_balance: Optional[float] = None
    expected_balance: Optional[float] = None
    net_sales: float
    total_cash_in: float
    total_cash_out: float
    status: ShiftStatus
    discrepancy: Optional[float] = None
    opened_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
