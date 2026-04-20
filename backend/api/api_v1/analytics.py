from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, time, timedelta
from typing import Dict, Any, List

from api.deps import get_db, get_current_user_token, get_current_restaurant
from models.order import Order, OrderStatus
from api.api_v1.users import require_owner

router = APIRouter()

@router.get("/today", response_model=Dict[str, Any])
def get_daily_analytics(
    db: Session = Depends(get_db), 
    token: dict = Depends(require_owner),
    restaurant_id=Depends(get_current_restaurant)
):
    """Secure endpoint to calculate high-level operational statistics for today."""
    
    # Calculate bounds for "today"
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min).replace(tzinfo=timezone.utc)
    
    # 1. Total Daily Revenue (across all orders not cancelled/deleted)
    # We'll calculate it from ACCEPTED, PREPARING, READY, SERVED statuses. Let's just say anything not PENDING? Wait, PENDING orders haven't been accepted yet, so they don't count towards guaranteed revenue untill accepted. But wait, we can just sum anything that exists and isn't deleted. Let's do SERVED + READY + PREPARING + ACCEPTED
    valid_statuses = [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]
    
    daily_orders = db.query(Order).filter(
        Order.restaurant_id == str(restaurant_id),
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

@router.get("/history", response_model=List[Dict[str, Any]])
def get_historical_analytics(
    db: Session = Depends(get_db), 
    token: dict = Depends(require_owner),
    restaurant_id=Depends(get_current_restaurant)
):
    """Secure endpoint to calculate stats for the last 7 days."""
    
    # Calculate bounds for last 7 days
    now_utc = datetime.now(timezone.utc)
    today_start = datetime.combine(now_utc.date(), time.min).replace(tzinfo=timezone.utc)
    start_date = today_start - timedelta(days=6) # 7 days including today
    
    valid_statuses = [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]
    all_statuses = valid_statuses + [OrderStatus.PENDING, OrderStatus.CANCELLED]
    
    orders = db.query(Order).filter(
        Order.restaurant_id == str(restaurant_id),
        Order.created_at >= start_date,
        Order.status.in_(all_statuses)
    ).all()

    history = []
    
    for i in range(7):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        daily_orders = [o for o in orders if day_start <= o.created_at < day_end]
        
        revenue = sum([o.total_amount for o in daily_orders if o.status in valid_statuses and o.total_amount])
        total_orders = len(daily_orders)
        completed = len([o for o in daily_orders if o.status == OrderStatus.SERVED])
        
        history.append({
            "date": day_start.strftime("%b %d"),
            "revenue": revenue,
            "total_orders": total_orders,
            "active_orders": 0,
            "completed": completed
        })
        
    return history
