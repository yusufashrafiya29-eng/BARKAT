from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import razorpay
import uuid
import hmac
import hashlib

from db.session import get_db
from models.saas_payment import SaaSPayment
from models.restaurant import Restaurant
from models.user import User
from core.config import settings
from api.api_v1.auth import get_current_user

router = APIRouter()

# Initialize Razorpay Client for SaaS Platform
def get_saas_razorpay_client():
    if not settings.SAAS_RAZORPAY_KEY_ID or not settings.SAAS_RAZORPAY_KEY_SECRET:
        # If keys are missing (e.g. testing mode or user hasn't set them up yet),
        # return None and we will mock the Razorpay order creation
        return None
    return razorpay.Client(auth=(settings.SAAS_RAZORPAY_KEY_ID, settings.SAAS_RAZORPAY_KEY_SECRET))

class CreateSubscriptionOrderRequest(BaseModel):
    plan_name: str
    is_yearly: bool

class VerifySubscriptionPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order")
def create_subscription_order(
    req: CreateSubscriptionOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only owners can subscribe
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can manage subscriptions")
    
    # Calculate amount based on plan
    amount = 0
    if req.plan_name == "basic":
        amount = 8000 if req.is_yearly else 800
    elif req.plan_name == "pro":
        amount = 14000 if req.is_yearly else 1400
    elif req.plan_name == "max":
        amount = 19990 if req.is_yearly else 1999
    else:
        raise HTTPException(status_code=400, detail="Invalid plan name")
        
    client = get_saas_razorpay_client()
    
    order_id = None
    if client:
        try:
            # Amount is in paise
            data = {
                "amount": amount * 100,
                "currency": "INR",
                "receipt": str(uuid.uuid4())[:15]
            }
            rzp_order = client.order.create(data=data)
            order_id = rzp_order.get("id")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")
    else:
        # Mock order for testing when keys are absent
        order_id = f"order_mock_{uuid.uuid4().hex[:10]}"

    # Save payment intent in DB
    payment = SaaSPayment(
        restaurant_id=current_user.restaurant_id,
        amount=amount,
        plan_name=req.plan_name,
        billing_cycle="yearly" if req.is_yearly else "monthly",
        razorpay_order_id=order_id,
        status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "success": True,
        "order_id": order_id,
        "amount": amount * 100,
        "currency": "INR",
        "key_id": settings.SAAS_RAZORPAY_KEY_ID or "mock_key_id"
    }

@router.post("/verify")
def verify_subscription_payment(
    req: VerifySubscriptionPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(SaaSPayment).filter(SaaSPayment.razorpay_order_id == req.razorpay_order_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if payment.status == "PAID":
        return {"success": True, "message": "Already paid"}

    # Verify signature
    client = get_saas_razorpay_client()
    is_valid = False
    
    if client:
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': req.razorpay_order_id,
                'razorpay_payment_id': req.razorpay_payment_id,
                'razorpay_signature': req.razorpay_signature
            })
            is_valid = True
        except Exception as e:
            is_valid = False
    else:
        # Mock verification for testing
        is_valid = True

    if not is_valid:
        payment.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    # Update payment record
    payment.status = "PAID"
    payment.razorpay_payment_id = req.razorpay_payment_id
    payment.razorpay_signature = req.razorpay_signature
    
    # Update restaurant subscription
    restaurant = db.query(Restaurant).filter(Restaurant.id == payment.restaurant_id).first()
    if restaurant:
        restaurant.subscription_status = "active"
        restaurant.subscription_plan = payment.plan_name
        
        # Extend subscription end date
        now = datetime.now()
        # If they already have an active sub with future end date, extend from there
        if restaurant.subscription_ends_at and restaurant.subscription_ends_at > now:
            start_date = restaurant.subscription_ends_at
        else:
            start_date = now
            
        if payment.billing_cycle == "yearly":
            restaurant.subscription_ends_at = start_date + timedelta(days=365)
        else:
            restaurant.subscription_ends_at = start_date + timedelta(days=30)

    db.commit()

    return {"success": True, "message": "Subscription activated successfully"}
