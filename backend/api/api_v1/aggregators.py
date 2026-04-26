from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from db.session import get_db
from models.user import User, UserRole
from models.restaurant import Restaurant
from models.menu import MenuItem
from models.order import Order, OrderItem, OrderStatus
from models.table import Table
from services.auth_service import get_current_user

router = APIRouter()

# Schema for incoming simulated webhook payload
class AggregatorItem(BaseModel):
    menu_item_id: str
    quantity: int
    notes: Optional[str] = None

class AggregatorWebhookPayload(BaseModel):
    restaurant_id: str
    source: str # ZOMATO or SWIGGY
    external_order_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    items: List[AggregatorItem]
    # In reality, this payload would be much larger and more complex, matching UrbanPiper's structure.

@router.post("/webhook/order")
async def receive_aggregator_order(payload: AggregatorWebhookPayload, db: Session = Depends(get_db)):
    """
    Simulates receiving an order from UrbanPiper / Zomato / Swiggy.
    """
    # 1. Verify restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == payload.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # 2. Check if this order was already processed
    existing_order = db.query(Order).filter(
        Order.restaurant_id == restaurant.id,
        Order.external_order_id == payload.external_order_id,
        Order.source == payload.source
    ).first()
    if existing_order:
        return {"status": "success", "message": "Order already processed", "order_id": existing_order.id}

    # 3. Find a table to assign this to. 
    # For take-away/delivery, POS systems often use a dummy 'Takeaway' table or handle it table-less.
    # We will look for a table named 'Delivery' or use the first table as fallback for now.
    table = db.query(Table).filter(Table.restaurant_id == restaurant.id, Table.table_number == 999).first()
    if not table:
        # Create a virtual delivery table if it doesn't exist
        table = Table(restaurant_id=restaurant.id, table_number=999, capacity=0, category="Delivery")
        db.add(table)
        db.flush()

    # 4. Create the Order
    new_order = Order(
        restaurant_id=restaurant.id,
        table_id=table.id,
        source=payload.source, # ZOMATO or SWIGGY
        external_order_id=payload.external_order_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        status=OrderStatus.ACCEPTED, # Aggregator orders are usually auto-accepted into KDS
        payment_status="PAID", # Usually prepaid on the app
        is_accepted=True
    )
    db.add(new_order)
    db.flush()

    # 5. Add Items and calculate totals
    subtotal = 0.0
    for item_data in payload.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_data.menu_item_id, 
            MenuItem.restaurant_id == restaurant.id
        ).first()
        if not menu_item:
            # In a real scenario, we would map via external_id, but for mock we use our own ID
            continue
        
        price = menu_item.price
        sub = price * item_data.quantity
        subtotal += sub
        
        order_item = OrderItem(
            order_id=new_order.id,
            menu_item_id=menu_item.id,
            quantity=item_data.quantity,
            price_at_order_time=price,
            subtotal=sub,
            notes=item_data.notes
        )
        db.add(order_item)
        
        # Deduct BOM inventory (Re-using logic from order_service would be ideal here, 
        # but for simplicity we'll let KDS handle the fulfillment)

    tax = subtotal * 0.05
    new_order.subtotal_amount = subtotal
    new_order.tax_amount = tax
    new_order.total_amount = subtotal + tax

    db.commit()
    db.refresh(new_order)

    return {
        "status": "success",
        "message": f"Order created from {payload.source}",
        "order_id": new_order.id
    }
