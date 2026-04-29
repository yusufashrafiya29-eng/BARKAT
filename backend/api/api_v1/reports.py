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

@router.get("/items/csv")
def download_item_report(
    start_date: date = None,
    end_date: date = None,
    token_str: str = None,
    db: Session = Depends(get_db)
):
    """Download item-wise sales report in CSV format."""
    if token_str:
        try:
            token = jwt.decode(token_str, settings.JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid query token")
    else:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    require_owner(token)
    from models.user import User
    user = db.query(User).filter(User.email == token.get("email")).first()
    if not user or not user.restaurant_id:
        raise HTTPException(status_code=400, detail="User not linked to any restaurant")
    restaurant_id = user.restaurant_id
    
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
        
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    from models.order import OrderItem
    from models.menu import MenuItem
    
    results = db.query(
        MenuItem.name,
        func.sum(OrderItem.quantity).label('total_qty'),
        func.sum(OrderItem.quantity * OrderItem.price_at_order_time).label('total_revenue')
    ).join(OrderItem, OrderItem.menu_item_id == MenuItem.id)\
     .join(Order, Order.id == OrderItem.order_id)\
     .filter(
        Order.restaurant_id == restaurant_id,
        Order.status == OrderStatus.SERVED,
        func.date(Order.created_at) >= start_date,
        func.date(Order.created_at) <= end_date
    ).group_by(MenuItem.name).order_by(func.sum(OrderItem.quantity).desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ITEM-WISE SALES REPORT"])
    writer.writerow(["Restaurant Name:", restaurant.name])
    writer.writerow(["Date Range:", f"{start_date.strftime('%d-%b-%Y')} to {end_date.strftime('%d-%b-%Y')}"])
    writer.writerow([])
    
    writer.writerow(["Item Name", "Quantity Sold", "Total Revenue (₹)"])
    
    total_q = 0
    total_rev = 0.0
    for row in results:
        total_q += row.total_qty
        total_rev += row.total_revenue
        writer.writerow([row.name, row.total_qty, round(row.total_revenue, 2)])
        
    writer.writerow([])
    writer.writerow(["GRAND TOTAL", total_q, round(total_rev, 2)])
    
    output.seek(0)
    filename = f"Item_Report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={'Content-Disposition': f'attachment; filename="{filename}"'})

@router.get("/shifts/csv")
def download_shifts_report(
    start_date: date = None,
    end_date: date = None,
    token_str: str = None,
    db: Session = Depends(get_db)
):
    """Download shift-wise Z-Report in CSV format."""
    if token_str:
        try:
            token = jwt.decode(token_str, settings.JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid query token")
    else:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    require_owner(token)
    from models.user import User
    user = db.query(User).filter(User.email == token.get("email")).first()
    if not user or not user.restaurant_id:
        raise HTTPException(status_code=400, detail="User not linked to any restaurant")
    restaurant_id = user.restaurant_id
    
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
        
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    from models.cash_register import CashShift
    
    shifts = db.query(CashShift).filter(
        CashShift.restaurant_id == restaurant_id,
        func.date(CashShift.opened_at) >= start_date,
        func.date(CashShift.opened_at) <= end_date
    ).order_by(CashShift.opened_at.asc()).all()
    
    user_ids = list(set([s.opened_by for s in shifts] + [s.closed_by for s in shifts if s.closed_by]))
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u.full_name for u in users}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["SHIFT-WISE Z-REPORT"])
    writer.writerow(["Restaurant Name:", restaurant.name])
    writer.writerow(["Date Range:", f"{start_date.strftime('%d-%b-%Y')} to {end_date.strftime('%d-%b-%Y')}"])
    writer.writerow([])
    
    writer.writerow([
        "Shift ID", "Status", "Opened At", "Closed At", "Opened By", "Closed By", 
        "Opening Balance (₹)", "Net Sales (₹)", "Total Cash In (₹)", "Total Cash Out (₹)", 
        "Expected Closing (₹)", "Actual Closing (₹)", "Discrepancy (₹)"
    ])
    
    for s in shifts:
        local_open = s.opened_at.astimezone() if s.opened_at.tzinfo else s.opened_at
        local_close = s.closed_at.astimezone() if s.closed_at and s.closed_at.tzinfo else s.closed_at
        
        expected = s.expected_balance if s.expected_balance is not None else (s.opening_balance + s.net_sales + s.total_cash_in - s.total_cash_out)
        actual = s.closing_balance if s.closing_balance is not None else 0.0
        discrepancy = actual - expected if s.status == "CLOSED" else 0.0
        
        writer.writerow([
            str(s.id)[:8],
            s.status.value if hasattr(s.status, 'value') else str(s.status),
            local_open.strftime("%Y-%m-%d %H:%M:%S"),
            local_close.strftime("%Y-%m-%d %H:%M:%S") if local_close else "Ongoing",
            user_map.get(s.opened_by, "Unknown"),
            user_map.get(s.closed_by, "N/A") if s.closed_by else "N/A",
            round(s.opening_balance, 2),
            round(s.net_sales, 2),
            round(s.total_cash_in, 2),
            round(s.total_cash_out, 2),
            round(expected, 2),
            round(actual, 2) if s.status == "CLOSED" else "N/A",
            round(discrepancy, 2) if s.status == "CLOSED" else "N/A"
        ])
        
    output.seek(0)
    filename = f"Z_Report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={'Content-Disposition': f'attachment; filename="{filename}"'})
