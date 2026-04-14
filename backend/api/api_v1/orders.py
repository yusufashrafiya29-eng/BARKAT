from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from backend.api.deps import get_db, get_current_user_token
from backend.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate, OrderUpdateItems
from backend.services import order_service
from backend.models.order import OrderStatus
from backend.models.notification import MessageType
from backend.services.whatsapp_service import trigger_whatsapp_message

router = APIRouter()

@router.post("/", response_model=OrderRead)
def create_new_order(
    order_in: OrderCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Open QR route. Hooks into BackgroundTasks to alert customers instantly."""
    order = order_service.create_order(db, order_in)
    
    if order.customer_phone:
        background_tasks.add_task(
            trigger_whatsapp_message, order.id, order.customer_phone, MessageType.ORDER_CONFIRMED, 
            "Your order has been received and sent to the kitchen!"
        )
    return order

@router.get("/kitchen/active", response_model=List[OrderRead])
def pull_kds_orders(
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """Strictly fetches PENDING and PREPARING orders for Kitchen displays that are accepted."""
    return order_service.get_active_kitchen_orders(db)

@router.get("/waiter/active", response_model=List[OrderRead])
def pull_waiter_orders(
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """Fetches PENDING and PREPARING orders for Waiter displays including unaccepted customer orders."""
    from backend.models.order import Order, OrderStatus
    from backend.models.billing import Bill, PaymentStatus
    return db.query(Order).outerjoin(Bill, Order.id == Bill.order_id).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]),
        (Bill.id == None) | (Bill.status != PaymentStatus.COMPLETED)
    ).order_by(Order.created_at.desc()).all()

@router.get("/table/{table_id}", response_model=List[OrderRead])
def get_table_orders(table_id: UUID, db: Session = Depends(get_db)):
    return order_service.get_orders_by_table(db, table_id)

@router.put("/{order_id}/accept", response_model=OrderRead)
def accept_customer_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    from backend.models.user import User
    from fastapi import HTTPException
    waiter = db.query(User).filter(User.id == token["sub"]).first()
    if not waiter:
        raise HTTPException(status_code=401, detail="Waiter not found in database")
    return order_service.accept_order(db, order_id, waiter.id)

@router.put("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: UUID, 
    status_update: OrderStatusUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token) 
):
    order = order_service.update_order_status(db, order_id, status_update.status)
    
    if order.customer_phone:
        if order.status == OrderStatus.PREPARING:
            background_tasks.add_task(
                trigger_whatsapp_message, order.id, order.customer_phone, MessageType.ORDER_PREPARING, 
                "Our chefs have started preparing your meal!"
            )
        elif order.status == OrderStatus.READY:
            background_tasks.add_task(
                trigger_whatsapp_message, order.id, order.customer_phone, MessageType.ORDER_READY, 
                "Your food is ready!"
            )
            
    return order

@router.delete("/{order_id}")
def delete_customer_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    return order_service.delete_order(db, order_id)

@router.put("/{order_id}/items", response_model=OrderRead)
def update_order_items(
    order_id: UUID,
    items_update: OrderUpdateItems,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    return order_service.update_order_items(db, order_id, items_update.items)
