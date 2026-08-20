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
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid query token")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Unexpected error decoding token in download_sales_report")
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
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid query token")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Unexpected error decoding token in download_item_report")
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
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid query token")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Unexpected error decoding token in download_shifts_report")
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

@router.get("/advanced")
def get_advanced_report(
    report_type: str,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """
    Advanced Reporting Endpoint returning JSON data for 15+ report types.
    Groups data in-memory to prevent SQL fan-out bugs on complex financial joins.
    """
    from models.order import Order, OrderItem, OrderStatus
    from models.menu import MenuItem, Category
    from models.user import User
    from models.billing import Bill
    from sqlalchemy import func

    # 1. Fetch Orders
    query = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        func.date(Order.created_at) >= start_date,
        func.date(Order.created_at) <= end_date
    )
    if report_type == "due_payments":
        query = query.filter(Order.payment_status == 'PARTIAL')
    else:
        query = query.filter(Order.status == OrderStatus.SERVED)
        
    orders = query.all()

    # 2. Extract IDs and batch fetch related data for fast lookup
    order_ids = [o.id for o in orders]
    if not order_ids:
        return {"data": [], "totals": {}}

    order_items = db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).all()
    menu_item_ids = list(set([oi.menu_item_id for oi in order_items]))
    menu_items = db.query(MenuItem).filter(MenuItem.id.in_(menu_item_ids)).all()
    
    category_ids = list(set([mi.category_id for mi in menu_items]))
    categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
    
    waiter_ids = list(set([o.waiter_id for o in orders if o.waiter_id]))
    waiters = db.query(User).filter(User.id.in_(waiter_ids)).all()

    # Lookup dicts
    mi_map = {mi.id: mi for mi in menu_items}
    cat_map = {c.id: c.name for c in categories}
    waiter_map = {w.id: w.full_name for w in waiters}
    
    # Pre-calculate item-level tax/discount allocation
    # Since Barkat Order has subtotal/tax at order level, we distribute it proportionally
    # to each item to allow perfect Category/Item grouping.
    bills = db.query(Bill).filter(Bill.order_id.in_(order_ids)).all()
    bill_discount_map = {b.order_id: b.discount_amount for b in bills}
    
    order_map = {}
    for o in orders:
        o_subtotal = getattr(o, 'subtotal_amount', 0.0) or o.total_amount
        o_tax = getattr(o, 'tax_amount', 0.0)
        o_discount = bill_discount_map.get(o.id, 0.0)
        order_map[o.id] = {
            "obj": o,
            "subtotal": o_subtotal,
            "tax": o_tax,
            "discount": o_discount,
            "total": o.total_amount
        }

    # Prepare grouping struct
    grouped_data = {}
    total_net = 0.0
    total_tax = 0.0
    total_sales = 0.0
    total_amount_overall = 0.0
    total_amount_paid = 0.0
    total_due_amount = 0.0

    # Execute Grouping Strategy
    if report_type in ["category", "item"]:
        for oi in order_items:
            mi = mi_map.get(oi.menu_item_id)
            if not mi: continue
            
            # Apportion Order Tax & Discount to this item based on its price ratio
            o_data = order_map[oi.order_id]
            ratio = (oi.subtotal / o_data["subtotal"]) if o_data["subtotal"] > 0 else 0
            
            allocated_tax = o_data["tax"] * ratio
            allocated_discount = o_data["discount"] * ratio
            allocated_sales = oi.subtotal + allocated_tax - allocated_discount

            # Group Key
            if report_type == "category":
                key = cat_map.get(mi.category_id, "Uncategorized")
            else:
                key = mi.name

            if key not in grouped_data:
                grouped_data[key] = {
                    "label": key,
                    "orders_set": set(),
                    "items": 0,
                    "net_amount": 0.0,
                    "discount": 0.0,
                    "tax": 0.0,
                    "sales": 0.0
                }
            
            gd = grouped_data[key]
            gd["orders_set"].add(oi.order_id)
            gd["items"] += oi.quantity
            gd["net_amount"] += oi.subtotal
            gd["discount"] += allocated_discount
            gd["tax"] += allocated_tax
            gd["sales"] += allocated_sales
            
            total_net += oi.subtotal
            total_tax += allocated_tax
            total_sales += allocated_sales

    elif report_type == "sales":
        for o in orders:
            local_dt = o.created_at.astimezone() if o.created_at.tzinfo else o.created_at
            key = local_dt.strftime("%d %b %Y")
            
            if key not in grouped_data:
                grouped_data[key] = {
                    "label": key,
                    "orders": 0,
                    "dine_in": 0.0,
                    "takeaway": 0.0,
                    "delivery": 0.0,
                    "net_amount": 0.0,
                    "tax": 0.0,
                    "sales": 0.0
                }
            
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["net_amount"] += getattr(o, 'subtotal_amount', o.total_amount)
            gd["tax"] += getattr(o, 'tax_amount', 0.0)
            order_sales = getattr(o, 'subtotal_amount', o.total_amount) + getattr(o, 'tax_amount', 0.0)
            gd["sales"] += order_sales
            
            if o.order_type == "DINE_IN": gd["dine_in"] += order_sales
            elif o.order_type == "TAKEAWAY": gd["takeaway"] += order_sales
            else: gd["delivery"] += order_sales
            
            total_net += getattr(o, 'subtotal_amount', o.total_amount)
            total_tax += getattr(o, 'tax_amount', 0.0)
            total_sales += order_sales

    elif report_type == "order_source":
        for o in orders:
            key = getattr(o, 'source', 'WAITER')
            if key == "CUSTOMER": key = "QR Menu"
            if getattr(o, 'razorpay_order_id', None): key = "Zomato/Swiggy/Online" # Placeholder mapping
            
            if key not in grouped_data:
                grouped_data[key] = {
                    "label": key,
                    "orders": 0,
                    "net_amount": 0.0,
                    "tax": 0.0,
                    "sales": 0.0
                }
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["net_amount"] += getattr(o, 'subtotal_amount', o.total_amount)
            gd["tax"] += getattr(o, 'tax_amount', 0.0)
            order_sales = getattr(o, 'subtotal_amount', o.total_amount) + getattr(o, 'tax_amount', 0.0)
            gd["sales"] += order_sales
            
            total_net += getattr(o, 'subtotal_amount', o.total_amount)
            total_tax += getattr(o, 'tax_amount', 0.0)
            total_sales += order_sales

    elif report_type in ["employee", "assignee"]:
        for o in orders:
            key = waiter_map.get(o.waiter_id, "Self Service / Online")
            
            if key not in grouped_data:
                grouped_data[key] = {
                    "label": key,
                    "orders": 0,
                    "net_amount": 0.0,
                    "sales": 0.0
                }
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["net_amount"] += getattr(o, 'subtotal_amount', o.total_amount)
            order_sales = getattr(o, 'subtotal_amount', o.total_amount) + getattr(o, 'tax_amount', 0.0)
            gd["sales"] += order_sales
            
            total_net += getattr(o, 'subtotal_amount', o.total_amount)
            total_sales += order_sales

    elif report_type == "nc":
        # Non-Chargeable Items (Total = 0 or Order Discount = 100%)
        for oi in order_items:
            o_data = order_map.get(oi.order_id, {})
            o_subtotal = o_data.get("subtotal", 0.0)
            o_discount = o_data.get("discount", 0.0)
            
            is_100_percent_discount = (o_subtotal > 0 and o_discount >= o_subtotal)
            
            if oi.subtotal == 0 or is_100_percent_discount:
                mi = mi_map.get(oi.menu_item_id)
                if not mi: continue
                key = mi.name
                
                if key not in grouped_data:
                    grouped_data[key] = {
                        "label": key,
                        "orders": 0,
                        "items": 0,
                        "net_amount": 0.0,
                        "tax": 0.0,
                        "sales": 0.0
                    }
                gd = grouped_data[key]
                gd["orders"] += 1
                gd["items"] += oi.quantity
    
    elif report_type == "cover":
        for o in orders:
            if not getattr(o, 'guests_count', None): continue
            key = f"{o.guests_count} Guests"
            if key not in grouped_data:
                grouped_data[key] = {"label": key, "orders": 0, "net_amount": 0.0, "tax": 0.0, "sales": 0.0}
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["net_amount"] += getattr(o, 'subtotal_amount', o.total_amount)
            gd["tax"] += getattr(o, 'tax_amount', 0.0)
            order_sales = getattr(o, 'subtotal_amount', o.total_amount) + getattr(o, 'tax_amount', 0.0)
            gd["sales"] += order_sales
            total_net += getattr(o, 'subtotal_amount', o.total_amount)
            total_tax += getattr(o, 'tax_amount', 0.0)
            total_sales += order_sales

    elif report_type == "locality":
        for o in orders:
            if not getattr(o, 'customer_address', None): continue
            key = o.customer_address
            if key not in grouped_data:
                grouped_data[key] = {"label": key, "orders": 0, "net_amount": 0.0, "tax": 0.0, "sales": 0.0}
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["net_amount"] += getattr(o, 'subtotal_amount', o.total_amount)
            gd["tax"] += getattr(o, 'tax_amount', 0.0)
            order_sales = getattr(o, 'subtotal_amount', o.total_amount) + getattr(o, 'tax_amount', 0.0)
            gd["sales"] += order_sales
            total_net += getattr(o, 'subtotal_amount', o.total_amount)
            total_tax += getattr(o, 'tax_amount', 0.0)
            total_sales += order_sales

    elif report_type == "counter":
        for o in orders:
            key = getattr(o, 'counter_name', 'Main Register')
            if key not in grouped_data:
                grouped_data[key] = {"label": key, "orders": 0, "net_amount": 0.0, "tax": 0.0, "sales": 0.0}
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["net_amount"] += getattr(o, 'subtotal_amount', o.total_amount)
            gd["tax"] += getattr(o, 'tax_amount', 0.0)
            order_sales = getattr(o, 'subtotal_amount', o.total_amount) + getattr(o, 'tax_amount', 0.0)
            gd["sales"] += order_sales
            total_net += getattr(o, 'subtotal_amount', o.total_amount)
            total_tax += getattr(o, 'tax_amount', 0.0)
            total_sales += order_sales
            
    elif report_type == "tip":
        for o in orders:
            if not getattr(o, 'tip_amount', None): continue
            local_dt = o.created_at.astimezone() if o.created_at.tzinfo else o.created_at
            key = local_dt.strftime("%d %b %Y")
            if key not in grouped_data:
                grouped_data[key] = {"label": key, "orders": 0, "net_amount": 0.0, "tax": 0.0, "sales": 0.0}
            gd = grouped_data[key]
            gd["orders"] += 1
            gd["sales"] += o.tip_amount # Represent tip as sales here
            total_sales += o.tip_amount

    elif report_type == "variation":
        # Variations require joining with modifiers
        from models.order import OrderItemModifier
        from models.menu import Modifier
        
        modifiers_db = db.query(OrderItemModifier, Modifier).join(Modifier).join(
            OrderItem, OrderItem.id == OrderItemModifier.order_item_id
        ).filter(
            OrderItem.order_id.in_([o.id for o in orders])
        ).all()
        
        for oim, mod in modifiers_db:
            key = mod.name
            if key not in grouped_data:
                grouped_data[key] = {"label": key, "orders_set": set(), "items": 0, "net_amount": 0.0, "tax": 0.0, "sales": 0.0}
            gd = grouped_data[key]
            gd["orders_set"].add(oim.order_item.order_id)
            gd["items"] += oim.order_item.quantity
            gd["net_amount"] += (oim.price_at_order_time * oim.order_item.quantity)
            gd["sales"] += (oim.price_at_order_time * oim.order_item.quantity)
            total_net += (oim.price_at_order_time * oim.order_item.quantity)
            total_sales += (oim.price_at_order_time * oim.order_item.quantity)

    elif report_type == "due_payments":
        for o in orders:
            local_dt = o.created_at.astimezone() if o.created_at.tzinfo else o.created_at
            
            b = next((b for b in bills if b.order_id == o.id), None)
            amount_paid = b.amount_paid if b else 0.0
            total_amt = getattr(o, 'total_amount', 0.0)
            
            key = str(o.id)
            grouped_data[key] = {
                "label": f"{o.customer_name or 'Walk-in'} / #{str(o.id)[-4:]}",
                "customer_phone": o.customer_phone,
                "total_amount": total_amt,
                "amount_paid": amount_paid,
                "due_amount": total_amt - amount_paid,
                "date": local_dt.strftime("%d %b %Y %I:%M %p"),
                "order_id": str(o.id),
                "sales": 0.0 # for sorting
            }
            total_amount_overall += total_amt
            total_amount_paid += amount_paid
            total_due_amount += (total_amt - amount_paid)

    else:
        # Fallback for Group
        grouped_data["Not Applicable"] = {
            "label": "Not enough data collected for this metric",
            "orders": 0,
            "net_amount": 0.0,
            "tax": 0.0,
            "sales": 0.0
        }

    # Format output & calculate percentages
    final_data = []
    for k, v in grouped_data.items():
        if "orders_set" in v:
            v["orders"] = len(v["orders_set"])
            del v["orders_set"]
            
        # Percentage calculation based on total_sales
        v["percentage"] = round((v["sales"] / total_sales * 100), 2) if total_sales > 0 else 0.0
        
        # Round financial values
        for field in ["net_amount", "discount", "tax", "sales", "dine_in", "takeaway", "delivery"]:
            if field in v: v[field] = round(v[field], 2)
            
        final_data.append(v)
        
    # Sort data by sales descending
    final_data = sorted(final_data, key=lambda x: x.get("sales", 0), reverse=True)

    return {
        "data": final_data,
        "totals": {
            "net_amount": round(total_net, 2),
            "tax": round(total_tax, 2),
            "sales": round(total_sales, 2),
            "orders": len(orders),
            "items": sum([oi.quantity for oi in order_items]) if order_items else 0,
            "total_amount": round(total_amount_overall, 2),
            "amount_paid": round(total_amount_paid, 2),
            "due_amount": round(total_due_amount, 2)
        }
    }
