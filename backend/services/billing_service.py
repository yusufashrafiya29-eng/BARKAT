from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from models.order import Order
from models.billing import Bill, PaymentStatus
from schemas.billing import BillCreate

def generate_bill(db: Session, order_id: UUID, bill_in: BillCreate, restaurant_id: str) -> Bill:
    existing = db.query(Bill).filter(Bill.order_id == order_id, Bill.restaurant_id == restaurant_id).first()
    if existing:
        return existing
        
    order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Cannot generate bill.")
        
    subtotal = order.total_amount
    tax_rate = 0.05 
    tax_amount = subtotal * tax_rate
    
    total_amount = subtotal + tax_amount - bill_in.discount_amount
    if total_amount < 0:
        total_amount = 0.0
        
    new_bill = Bill(
        restaurant_id=restaurant_id,
        order_id=order_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=bill_in.discount_amount,
        total_amount=total_amount,
        payment_method=bill_in.payment_method,
        status=PaymentStatus.PENDING
    )
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill

def confirm_payment(db: Session, order_id: UUID, transaction_id: str = None, restaurant_id: str = None) -> Bill:
    bill = db.query(Bill).filter(Bill.order_id == order_id, Bill.restaurant_id == restaurant_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found for this order. Generate bill first.")
        
    bill.status = PaymentStatus.COMPLETED
    if transaction_id:
        bill.transaction_id = transaction_id
        
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.payment_status = "PAID"
        from models.reservation import Reservation
        from datetime import datetime
        today_date = datetime.now().date()
        reservations = db.query(Reservation).filter(
            Reservation.table_id == order.table_id,
            Reservation.status == 'CONFIRMED',
            Reservation.reservation_date == today_date
        ).all()
        for res in reservations:
            res.status = 'COMPLETED'
        
    db.commit()
    db.refresh(bill)
    return bill
