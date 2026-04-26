from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from datetime import datetime, timezone

from models.cash_register import CashShift, CashTransaction, ShiftStatus, TransactionType


def get_current_shift(db: Session, restaurant_id: str) -> CashShift | None:
    """Returns the currently OPEN shift for this restaurant, or None."""
    return db.query(CashShift).filter(
        CashShift.restaurant_id == restaurant_id,
        CashShift.status == ShiftStatus.OPEN
    ).first()


def open_shift(db: Session, restaurant_id: str, user_id: str, opening_balance: float) -> CashShift:
    """Opens a new cash shift. Raises 409 if a shift is already open."""
    existing = get_current_shift(db, restaurant_id)
    if existing:
        raise HTTPException(status_code=409, detail="A shift is already open. Close it first before opening a new one.")

    shift = CashShift(
        restaurant_id=restaurant_id,
        opened_by=user_id,
        opening_balance=opening_balance,
        net_sales=0.0,
        total_cash_in=0.0,
        total_cash_out=0.0,
        status=ShiftStatus.OPEN
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


def close_shift(db: Session, shift_id: str, restaurant_id: str, user_id: str, closing_balance: float, notes: str | None) -> CashShift:
    """Closes a shift, records physical count, calculates discrepancy."""
    shift = db.query(CashShift).filter(
        CashShift.id == shift_id,
        CashShift.restaurant_id == restaurant_id,
        CashShift.status == ShiftStatus.OPEN
    ).first()

    if not shift:
        raise HTTPException(status_code=404, detail="Active shift not found.")

    # Expected = opening + all cash sales + cash in - cash out
    expected = shift.opening_balance + shift.net_sales + shift.total_cash_in - shift.total_cash_out

    shift.closing_balance = closing_balance
    shift.expected_balance = round(expected, 2)
    shift.closed_by = user_id
    shift.notes = notes
    shift.status = ShiftStatus.CLOSED
    shift.closed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(shift)
    return shift


def add_transaction(
    db: Session,
    shift_id: str,
    restaurant_id: str,
    user_id: str,
    type: TransactionType,
    amount: float,
    description: str | None
) -> CashTransaction:
    """Adds a manual CASH_IN or CASH_OUT entry to the active shift."""
    shift = db.query(CashShift).filter(
        CashShift.id == shift_id,
        CashShift.restaurant_id == restaurant_id,
        CashShift.status == ShiftStatus.OPEN
    ).first()

    if not shift:
        raise HTTPException(status_code=404, detail="Active shift not found.")

    tx = CashTransaction(
        shift_id=shift_id,
        created_by=user_id,
        type=type,
        amount=amount,
        description=description
    )
    db.add(tx)

    # Update shift running totals
    if type == TransactionType.CASH_IN:
        shift.total_cash_in += amount
    else:
        shift.total_cash_out += amount

    db.commit()
    db.refresh(tx)
    return tx


def record_sale(db: Session, restaurant_id: str, amount: float):
    """Called automatically when an order is marked PAID. Adds to net_sales of current shift."""
    shift = get_current_shift(db, restaurant_id)
    if shift:
        shift.net_sales += amount
        db.commit()


def get_shift_history(db: Session, restaurant_id: str, limit: int = 30):
    """Returns last N closed shifts."""
    return db.query(CashShift).filter(
        CashShift.restaurant_id == restaurant_id,
    ).order_by(CashShift.opened_at.desc()).limit(limit).all()
