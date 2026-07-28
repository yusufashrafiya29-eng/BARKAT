from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from models.order import Order
from models.billing import Bill, PaymentStatus, PaymentTransaction
from schemas.billing import BillCreate, PaymentConfirmation

def generate_bill(db: Session, order_id: UUID, bill_in: BillCreate, restaurant_id: str) -> Bill:
    existing = db.query(Bill).filter(Bill.order_id == order_id, Bill.restaurant_id == restaurant_id).first()
    if existing:
        return existing
        
    order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Cannot generate bill.")
        
    subtotal = order.subtotal_amount or 0.0
    tax_amount = order.tax_amount or 0.0
    discount = bill_in.discount_amount or 0.0
    total_amount = subtotal + tax_amount - discount
    if total_amount < 0:
        total_amount = 0.0
        
    new_bill = Bill(
        restaurant_id=restaurant_id,
        order_id=order_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount,
        total_amount=total_amount,
        payment_method=bill_in.payment_method,
        status=PaymentStatus.PENDING
    )
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill

def confirm_payment(db: Session, order_id: UUID, payload: PaymentConfirmation, restaurant_id: str) -> Bill:
    bill = db.query(Bill).filter(Bill.order_id == order_id, Bill.restaurant_id == restaurant_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found for this order. Generate bill first.")
        
    if bill.status == PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Bill is already fully paid.")
        
    txn = PaymentTransaction(
        bill_id=bill.id,
        restaurant_id=restaurant_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        status="COMPLETED"
    )
    db.add(txn)
    
    bill.amount_paid = (bill.amount_paid or 0.0) + payload.amount
    
    if (bill.amount_paid or 0.0) >= (bill.total_amount or 0.0):
        bill.status = PaymentStatus.COMPLETED
        
        order = db.query(Order).filter(Order.id == order_id).first()
        if order and order.payment_status != 'PAID':
            from services.order_service import update_payment_status
            update_payment_status(db, order_id, "PAID", restaurant_id)
            
    db.commit()
    db.refresh(bill)
    return bill
