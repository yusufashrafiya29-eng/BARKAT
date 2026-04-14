from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import UUID
from models.order import Order, OrderItem, OrderStatus
from models.menu import MenuItem
from schemas.order import OrderCreate

def create_order(db: Session, order_in: OrderCreate, waiter_id: UUID = None) -> Order:
    # 1. Validate Table Existence
    from models.table import Table
    table = db.query(Table).filter(Table.id == order_in.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # 2. Rate Limiting (30s cooldown for CUSTOMER orders)
    from datetime import datetime, timezone, timedelta
    if order_in.source == "CUSTOMER" and table.last_order_at:
        # Ensure we compare timezone-aware datetimes
        time_diff = datetime.now(timezone.utc) - table.last_order_at
        if time_diff < timedelta(seconds=30):
            raise HTTPException(
                status_code=429, 
                detail=f"Please wait {30 - int(time_diff.total_seconds())}s before placing another order."
            )

    # 3. Initialize Order record safely
    initial_status = OrderStatus.ACCEPTED if order_in.source == "WAITER" else OrderStatus.PENDING
    
    new_order = Order(
        table_id=order_in.table_id,
        waiter_id=waiter_id,
        source=order_in.source,
        status=initial_status,
        is_accepted=True if initial_status == OrderStatus.ACCEPTED else False,
        total_amount=0.0
    )
    db.add(new_order)
    db.flush() # Flush pushes to DB without permanent commit to generate new_order.id
    
    total = 0.0
    
    # 2. We never trust the client with price calculations.
    # We fetch the *current DB price* dynamically and calculate subtotal.
    for item_in in order_in.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_in.menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item_in.menu_item_id} not found")
        if not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"Menu item {menu_item.name} is currently unavailable")
            
        subtotal = menu_item.price * item_in.quantity
        total += subtotal
        
        new_order_item = OrderItem(
            order_id=new_order.id,
            menu_item_id=menu_item.id,
            quantity=item_in.quantity,
            price_at_order_time=menu_item.price,
            subtotal=subtotal,
            notes=item_in.notes
        )
        db.add(new_order_item)
        
    # 5. Apply exact total and commit atomic transaction
    new_order.total_amount = total
    
    # Update table's last order timestamp if customer order
    if order_in.source == "CUSTOMER":
        table.last_order_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(new_order)
    return new_order

def get_orders_by_table(db: Session, table_id: UUID):
    return db.query(Order).filter(Order.table_id == table_id).order_by(Order.created_at.desc()).all()

def update_order_status(db: Session, order_id: UUID, new_status: OrderStatus) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order

def get_active_kitchen_orders(db: Session):
    """Fetches ACCEPTED and PREPARING orders using strict FIFO (First In First Out) ordering."""
    return db.query(Order).filter(
        Order.status.in_([OrderStatus.ACCEPTED, OrderStatus.PREPARING])
    ).order_by(Order.created_at.asc()).all()

def accept_order(db: Session, order_id: UUID, waiter_id: UUID) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = OrderStatus.ACCEPTED
    order.is_accepted = True # Keeping for DB compatibility for now, but logic uses status
    order.waiter_id = waiter_id
    db.commit()
    db.refresh(order)
    return order

def delete_order(db: Session, order_id: UUID):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == OrderStatus.SERVED:
        raise HTTPException(status_code=400, detail="Cannot delete a served order")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted"}

def update_order_items(db: Session, order_id: UUID, items_in: list) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == OrderStatus.SERVED:
        raise HTTPException(status_code=400, detail="Cannot edit a served order")
    
    # 1. Wipe existing items
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
    
    # 2. Re-create items and calculate total
    total = 0.0
    for item_in in items_in:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_in.menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item not found")
        
        subtotal = menu_item.price * item_in.quantity
        total += subtotal
        
        new_item = OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=item_in.quantity,
            price_at_order_time=menu_item.price,
            subtotal=subtotal,
            notes=item_in.notes
        )
        db.add(new_item)
        
    # 3. Save new total
    order.total_amount = total
    db.commit()
    db.refresh(order)
    return order
