from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.cash_register import (
    OpenShiftRequest, CloseShiftRequest,
    CashShiftRead, CashTransactionCreate, CashTransactionRead, ShiftSummary
)
from services import cash_service

router = APIRouter()


def _require_owner_or_manager(token: dict):
    if token.get("role") not in ("OWNER", "WAITER"):
        raise HTTPException(status_code=403, detail="Not authorized")


# ── Open Shift ─────────────────────────────────────────────────────────────────
@router.post("/shift/open", response_model=CashShiftRead)
def open_shift(
    payload: OpenShiftRequest,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Open a new cash shift. Only one shift can be open at a time."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required to open a shift.")
    return cash_service.open_shift(db, str(restaurant_id), token["sub"], payload.opening_balance)


# ── Get Current Shift ──────────────────────────────────────────────────────────
@router.get("/shift/current", response_model=CashShiftRead)
def get_current_shift(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Get the currently open shift (if any)."""
    shift = cash_service.get_current_shift(db, str(restaurant_id))
    if not shift:
        raise HTTPException(status_code=404, detail="No shift is currently open.")
    return shift


# ── Close Shift ────────────────────────────────────────────────────────────────
@router.put("/shift/{shift_id}/close", response_model=CashShiftRead)
def close_shift(
    shift_id: UUID,
    payload: CloseShiftRequest,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Close the active shift. Requires physically counted closing balance."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required to close a shift.")
    return cash_service.close_shift(db, str(shift_id), str(restaurant_id), token["sub"], payload.closing_balance, payload.notes)


# ── Add Transaction ────────────────────────────────────────────────────────────
@router.post("/shift/{shift_id}/transaction", response_model=CashTransactionRead)
def add_transaction(
    shift_id: UUID,
    payload: CashTransactionCreate,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Add a manual CASH_IN or CASH_OUT entry to the active shift."""
    return cash_service.add_transaction(
        db, str(shift_id), str(restaurant_id), token["sub"],
        payload.type, payload.amount, payload.description
    )


# ── Shift History ──────────────────────────────────────────────────────────────
@router.get("/shift/history", response_model=List[CashShiftRead])
def get_shift_history(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Get all past shifts for this restaurant (Owner only)."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required.")
    return cash_service.get_shift_history(db, str(restaurant_id))
