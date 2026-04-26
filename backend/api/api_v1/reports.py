from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from uuid import UUID
import io
import csv

from api.deps import get_db, get_current_user_token, get_current_restaurant
from models.order import Order, OrderStatus
from models.restaurant import Restaurant
from api.api_v1.users import require_owner
import jwt
from core.config import settings

router = APIRouter()

@router.get("/sales/csv")
def download_sales_report(
    start_date: date = None,
    end_date: date = None,
    token_str: str = None,
    db: Session = Depends(get_db)
):
    """Download GST/Sales report in CSV format for CA/Accountant."""
    
    # Try resolving token from query param if not in header
    if token_str:
        try:
            token = jwt.decode(token_str, settings.JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid query token")
    elif not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    require_owner(token)
    
    # Manually get restaurant_id from token since Depends gets skipped for query tokens if we bypass standard auth
    from models.user import User
    user = db.query(User).filter(User.email == token.get("email")).first()
    if not user or not user.restaurant_id:
        raise HTTPException(status_code=400, detail="User not linked to any restaurant")
    restaurant_id = user.restaurant_id
    
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
        
    # Get Restaurant Info for headers
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    # Query all completed/paid orders within date range
    orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        Order.status == OrderStatus.SERVED,
        func.date(Order.created_at) >= start_date,
        func.date(Order.created_at) <= end_date
    ).order_by(Order.created_at.asc()).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header Info
    writer.writerow(["RESTAURANT SALES REPORT"])
    writer.writerow(["Restaurant Name:", restaurant.name])
    writer.writerow(["GSTIN:", restaurant.gstin or "N/A"])
    writer.writerow(["FSSAI:", restaurant.fssai or "N/A"])
    writer.writerow(["Date Range:", f"{start_date.strftime('%d-%b-%Y')} to {end_date.strftime('%d-%b-%Y')}"])
    writer.writerow([])
    
    # Write Column Headers
    writer.writerow([
        "Order Date", 
        "Order Time", 
        "Customer Name", 
        "Customer Phone", 
        "Subtotal (₹)", 
        "Tax Amount (₹)", 
        "Total Amount (₹)", 
        "Payment Status"
    ])
    
    total_subtotal = 0.0
    total_tax = 0.0
    total_revenue = 0.0
    
    for order in orders:
        local_dt = order.created_at.astimezone() if order.created_at.tzinfo else order.created_at
        
        # Fallback to total_amount if subtotal/tax wasn't populated in old orders
        subtotal = getattr(order, 'subtotal_amount', 0.0)
        tax = getattr(order, 'tax_amount', 0.0)
        total = order.total_amount
        
        if subtotal == 0 and tax == 0 and total > 0:
            # Legacy order calculation (assume 5% tax included backwards math or just put it all in subtotal)
            subtotal = total
            
        total_subtotal += subtotal
        total_tax += tax
        total_revenue += total
        
        writer.writerow([
            local_dt.strftime("%Y-%m-%d"),
            local_dt.strftime("%H:%M:%S"),
            order.customer_name or "Walk-in",
            order.customer_phone or "N/A",
            round(subtotal, 2),
            round(tax, 2),
            round(total, 2),
            order.payment_status
        ])
        
    writer.writerow([])
    writer.writerow(["", "", "", "GRAND TOTAL:", round(total_subtotal, 2), round(total_tax, 2), round(total_revenue, 2)])
    
    output.seek(0)
    
    filename = f"Sales_Report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
    
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
