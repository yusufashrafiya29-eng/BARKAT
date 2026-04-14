from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, time
from typing import Dict, Any

from backend.api.deps import get_db, get_current_user_token
from backend.models.order import Order, OrderStatus
from backend.api.api_v1.users import require_owner

router = APIRouter()

@router.get("/today", response_model=Dict[str, Any])
def get_daily_analytics(
    db: Session = Depends(get_db), 
    token: dict = Depends(require_owner)
):
    """Secure endpoint to calculate high-level operational statistics for today."""
    
    # Calculate bounds for "today"
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min).replace(tzinfo=timezone.utc)
    
    # 1. Total Daily Revenue (across all orders not cancelled/deleted)
    # We'll calculate it from ACCEPTED, PREPARING, READY, SERVED statuses. Let's just say anything not PENDING? Wait, PENDING orders haven't been accepted yet, so they don't count towards guaranteed revenue untill accepted. But wait, we can just sum anything that exists and isn't deleted. Let's do SERVED + READY + PREPARING + ACCEPTED
    valid_statuses = [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]
    
    daily_orders = db.query(Order).filter(
        Order.created_at >= today_start,
        Order.status.in_(valid_statuses)
    ).all()
    
    total_revenue = sum([o.total_amount for o in daily_orders if o.total_amount])
    total_orders_count = len(daily_orders)
    
    # 2. Active Orders waiting (Kitchen/Waiter bounds)
    active_orders = len([o for o in daily_orders if o.status in [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY]])
    
    # 3. Served today
    served_orders = len([o for o in daily_orders if o.status == OrderStatus.SERVED])
    
    return {
        "today_revenue": total_revenue,
        "total_orders": total_orders_count,
        "active_orders": active_orders,
        "served_orders": served_orders
    }
