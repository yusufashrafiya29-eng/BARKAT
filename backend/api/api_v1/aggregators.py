import math
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from api.deps import get_db, get_current_user
from models.user import User
from models.aggregator import AggregatorOrder
from schemas.order import AggregatorOrderResponse # I will create this schema
from services.ws_manager import manager
import uuid

router = APIRouter()

@router.get("/orders")
def get_aggregator_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all live aggregator orders for KDS"""
    if not current_user.restaurant_id:
        raise HTTPException(status_code=400, detail="Not assigned to a restaurant")
        
    orders = db.query(AggregatorOrder).filter(
        AggregatorOrder.restaurant_id == current_user.restaurant_id,
        AggregatorOrder.status.in_(['NEW', 'KITCHEN_PREPARING', 'READY_FOR_RIDER'])
    ).order_by(AggregatorOrder.created_at.desc()).all()
    
    return orders

@router.post("/webhooks/simulate")
async def simulate_webhook_drop(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Simulate a webhook drop from the frontend.
    This replaces the frontend mock array with a real DB insertion.
    """
    if not current_user.restaurant_id:
        raise HTTPException(status_code=400, detail="Not assigned to a restaurant")
        
    gross = payload.get("gross_amount", 800)
    comm_rate = payload.get("platform_commission_rate", 22)
    net = round(gross * (1 - comm_rate / 100))
    gst_on_comm = round(comm_rate * gross * 0.0018)
    
    order = AggregatorOrder(
        restaurant_id=current_user.restaurant_id,
        platform=payload.get("platform", "Zomato"),
        platform_order_id=payload.get("platform_order_id", f"SIM-{uuid.uuid4().hex[:6].upper()}"),
        customer_name=payload.get("customer_name", "Mock Customer"),
        items_summary=payload.get("items_summary", "1x Item"),
        gross_amount=gross,
        platform_commission_rate=comm_rate,
        ad_deduction=0.0,
        gst_on_commission=gst_on_comm,
        net_payout=net,
        status="NEW",
        rider_name=payload.get("rider_name", "Valet Partner"),
        rider_status="ASSIGNED_WAITING",
        eta="Arriving in 10 mins",
        raw_payload=payload
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Broadcast to all connected WebSockets for this restaurant
    await manager.broadcast(str(current_user.restaurant_id), {
        "type": "NEW_AGGREGATOR_ORDER",
        "order_id": str(order.id),
        "platform": order.platform
    })
    
    return {"message": "Webhook simulated and saved to DB", "order_id": order.id}

@router.put("/orders/{order_id}/status")
def update_aggregator_order_status(
    order_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update status of an aggregator order (e.g. Mark Ready)"""
    order = db.query(AggregatorOrder).filter(AggregatorOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.restaurant_id != current_user.restaurant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    status = payload.get("status")
    if status in ['NEW', 'KITCHEN_PREPARING', 'READY_FOR_RIDER', 'DELIVERED']:
        order.status = status
        db.commit()
        
        # Here we would also call Zomato/Swiggy API to update status on their end!
        # e.g. if status == 'READY_FOR_RIDER': push_status_to_zomato(order.platform_order_id)
        
    return {"message": "Status updated"}

# --- The Real Webhook Stubs for Future ---

@router.post("/webhooks/zomato")
async def zomato_live_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Real endpoint where Zomato will POST order data.
    """
    payload = await request.json()
    # 1. Verify Zomato Signature Header
    # 2. Find restaurant_id using payload['store_id'] from restaurant_config table
    # 3. Create AggregatorOrder
    return {"status": "success", "message": "Order received"}

@router.post("/webhooks/swiggy")
async def swiggy_live_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Real endpoint where Swiggy will POST order data.
    """
    payload = await request.json()
    return {"status": "success", "message": "Order received"}
