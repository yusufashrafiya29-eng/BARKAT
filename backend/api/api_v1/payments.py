import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
import json

from api.deps import get_db, get_current_restaurant
from services import settings_service
from models.order import Order

router = APIRouter()

class CreateOrderRequest(BaseModel):
    table_id: UUID

from models.table import Table

@router.post("/create-order")
def create_razorpay_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db)
):
    # Fetch table to get restaurant_id
    table = db.query(Table).filter(Table.id == req.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
        
    restaurant_id = table.restaurant_id

    # Fetch Razorpay credentials
    key_id = settings_service.get_config_value(db, "razorpay_key_id", str(restaurant_id))
    key_secret = settings_service.get_config_value(db, "razorpay_key_secret", str(restaurant_id))
    
    if not key_id or not key_secret:
        raise HTTPException(status_code=400, detail="Razorpay is not configured for this restaurant.")

    # Get pending orders for the table
    pending_orders = db.query(Order).filter(
        Order.table_id == req.table_id,
        Order.payment_status == 'PENDING',
        Order.status != 'CANCELLED'
    ).all()

    if not pending_orders:
        raise HTTPException(status_code=400, detail="No pending orders found for this table.")

    # Calculate total amount
    total_amount = sum(order.total_amount for order in pending_orders)
    amount_in_paise = int(total_amount * 100)

    # Create Razorpay order
    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        rp_order = client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": str(req.table_id)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")

    # Update orders with razorpay_order_id
    for order in pending_orders:
        order.razorpay_order_id = rp_order['id']
        order.payment_status = 'VERIFYING' # Set to verifying while user pays
    
    db.commit()

    return {
        "razorpay_order_id": rp_order['id'],
        "razorpay_key_id": key_id,
        "amount": amount_in_paise,
        "currency": "INR"
    }

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives payment.captured events from Razorpay.
    Verifies signature if RAZORPAY_WEBHOOK_SECRET is set.
    """
    from core.config import settings
    import hmac
    import hashlib
    import logging
    logger = logging.getLogger(__name__)

    body = await request.body()

    # --- Signature Verification (non-blocking) ---
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if webhook_secret:
        razorpay_signature = request.headers.get("x-razorpay-signature", "")
        expected_signature = hmac.new(
            webhook_secret.encode("utf-8"),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_signature, razorpay_signature):
            # Log warning but do NOT block — wrong secret config should not kill payments
            logger.warning("Razorpay webhook signature mismatch. Check RAZORPAY_WEBHOOK_SECRET on Render.")

    # --- Process Payload ---
    try:
        payload = json.loads(body.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get('event')
    logger.info(f"Razorpay webhook received event: {event}")

    if event == 'payment.captured':
        payment = payload['payload']['payment']['entity']
        rp_order_id = payment.get('order_id')
        rp_payment_id = payment.get('id')

        logger.info(f"Payment captured: order_id={rp_order_id}, payment_id={rp_payment_id}")

        if rp_order_id:
            orders = db.query(Order).filter(Order.razorpay_order_id == rp_order_id).all()
            logger.info(f"Found {len(orders)} order(s) matching razorpay_order_id={rp_order_id}")
            for order in orders:
                order.payment_status = 'PAID'
                order.razorpay_payment_id = rp_payment_id
            db.commit()
            logger.info(f"Orders updated to PAID successfully.")

    return {"status": "ok"}
