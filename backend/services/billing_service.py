from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from models.order import Order
from models.billing import Bill, PaymentStatus, PaymentTransaction
from schemas.billing import BillCreate, PaymentConfirmation

def generate_bill(db: Session, order_id: UUID, bill_in: BillCreate, restaurant_id: str) -> Bill:
    order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Cannot generate bill.")
        
    subtotal = order.subtotal_amount or 0.0
    tax_amount = order.tax_amount or 0.0
    discount = bill_in.discount_amount or 0.0
    total_amount = subtotal + tax_amount - discount
    if total_amount < 0:
        total_amount = 0.0

    existing = db.query(Bill).filter(Bill.order_id == order_id, Bill.restaurant_id == restaurant_id).first()
    if existing:
        existing.subtotal = subtotal
        existing.tax_amount = tax_amount
        existing.discount_amount = discount
        existing.total_amount = total_amount
        existing.payment_method = bill_in.payment_method
        db.commit()
        db.refresh(existing)
        return existing
        
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
    
    # Update the bill's main payment method to reflect the actual confirmed payment
    bill.payment_method = payload.payment_method
    
    if (bill.amount_paid or 0.0) >= (bill.total_amount or 0.0):
        bill.status = PaymentStatus.COMPLETED
        
        # FIX BUG-012: Update order payment status inline (same transaction)
        # Avoids double-commit race condition from calling update_payment_status()
        order = db.query(Order).filter(Order.id == order_id).first()
        if order and order.payment_status != 'PAID':
            order.payment_status = 'PAID'
            # Trigger CRM & cash register via the service but AFTER our single commit
            # We pass db without committing inside — the commit below covers everything
            _handle_order_paid_side_effects(db, order, restaurant_id, payload.payment_method)
    else:
        bill.status = PaymentStatus.PARTIAL
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.payment_status = 'PARTIAL'
            
    db.commit()  # Single commit covers bill, txn, and order status
    db.refresh(bill)
    return bill


def _handle_order_paid_side_effects(db: Session, order, restaurant_id: str, payment_method: str = "CASH"):
    """Handle CRM, loyalty, and cash register updates when an order is paid.
    Called within an open transaction — does NOT commit itself.
    """
    # Auto-record sale in active cash shift
    from services.cash_service import record_sale
    record_sale(db, restaurant_id, order.total_amount, payment_method)
    
    # CRM & Loyalty Points
    if order.customer_phone:
        from models.customer import Customer
        from services.notification_service import send_whatsapp_receipt
        
        customer = db.query(Customer).filter(
            Customer.restaurant_id == restaurant_id,
            Customer.phone_number == order.customer_phone
        ).first()
        
        points_earned = int((order.total_amount or 0) // 100)
        
        if not customer:
            customer = Customer(
                restaurant_id=restaurant_id,
                phone_number=order.customer_phone,
                name=order.customer_name,
                loyalty_points=points_earned,
                total_spent=order.total_amount or 0,
                total_visits=1
            )
            db.add(customer)
        else:
            customer.loyalty_points += points_earned
            customer.total_spent += (order.total_amount or 0)
            customer.total_visits += 1
            if order.customer_name and not customer.name:
                customer.name = order.customer_name
        
        # Note: send_whatsapp_receipt is fire-and-forget; no DB state change
        try:
            send_whatsapp_receipt(order, customer)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Failed to send WhatsApp receipt")
            pass  # Non-fatal: receipt failure should not block payment confirmation
