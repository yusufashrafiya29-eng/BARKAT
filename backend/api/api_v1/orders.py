from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.order import OrderCreate, OrderRead, OrderStatusUpdate, OrderUpdateItems, PaymentStatusUpdate, ClearHistoryRequest
from services import order_service
from models.order import OrderStatus
from models.notification import MessageType
from services.whatsapp_service import trigger_whatsapp_message
from fastapi import WebSocket, WebSocketDisconnect, Query
from core.config import settings
import jwt
from jwt.exceptions import InvalidTokenError
from services.ws_manager import manager as ws_manager

router = APIRouter()

def notify_kds(background_tasks: BackgroundTasks, restaurant_id: str, order_id: UUID, db: Session):
    from sqlalchemy.orm import joinedload
    from models.order import Order
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        return
    
    message = {
        "event": "ORDER_UPDATE",
        "id": str(order.id),
        "table_id": str(order.table_id) if order.table_id else None,
        "order_type": order.order_type,
        "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
        "created_at": order.created_at.isoformat() + "Z" if order.created_at else "",
        "items": [{
            "id": str(item.id),
            "menu_item_id": str(item.menu_item_id),
            "quantity": item.quantity,
            "notes": item.notes,
            "status": item.status,
            "is_parcel": item.is_parcel
        } for item in order.items]
    }
    background_tasks.add_task(ws_manager.broadcast, str(restaurant_id), message)

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
    notify_kds(background_tasks, str(order.restaurant_id), order.id, db)
    return order

@router.get("/kitchen/active", response_model=List[OrderRead])
def pull_kds_orders(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Strictly fetches PENDING and PREPARING orders for Kitchen displays that are accepted."""
    return order_service.get_active_kitchen_orders(db, str(restaurant_id))

@router.get("/waiter/active", response_model=List[OrderRead])
def pull_waiter_orders(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Fetches PENDING and PREPARING orders for Waiter displays including unaccepted customer orders."""
    from models.order import Order, OrderStatus
    from models.billing import Bill, PaymentStatus
    from sqlalchemy.orm import joinedload
    return db.query(Order).options(joinedload(Order.items)).outerjoin(Bill, Order.id == Bill.order_id).filter(
        Order.restaurant_id == restaurant_id,
        Order.status.in_([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]),
        (Bill.id == None) | (Bill.status != PaymentStatus.COMPLETED),
        Order.payment_status != 'PAID'
    ).order_by(Order.created_at.desc()).all()

@router.get("/table/{table_id}", response_model=List[OrderRead])
def get_table_orders(table_id: UUID, db: Session = Depends(get_db)):
    return order_service.get_orders_by_table(db, table_id)

@router.put("/table/{table_id}/verify-payment")
def verify_table_payments(table_id: UUID, db: Session = Depends(get_db)):
    from models.order import Order
    orders = db.query(Order).filter(Order.table_id == table_id, Order.payment_status == 'PENDING').all()
    for o in orders:
        o.payment_status = 'VERIFYING'
    db.commit()
    return {"message": "Updated to VERIFYING"}

@router.put("/{order_id}/accept", response_model=OrderRead)
def accept_customer_order(
    order_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    from models.user import User
    from fastapi import HTTPException
    waiter = db.query(User).filter(User.id == token["sub"]).first()
    if not waiter:
        raise HTTPException(status_code=401, detail="Waiter not found in database")
    order = order_service.accept_order(db, order_id, waiter.id, str(restaurant_id))
    notify_kds(background_tasks, str(restaurant_id), order.id, db)
    return order

@router.put("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: UUID, 
    status_update: OrderStatusUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    order = order_service.update_order_status(db, order_id, status_update.status, str(restaurant_id))
    
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
            
    notify_kds(background_tasks, str(restaurant_id), order.id, db)
    return order

from schemas.order import OrderItemStatusUpdate, OrderItemRead
@router.put("/items/{item_id}/status", response_model=OrderItemRead)
def update_item_status(
    item_id: UUID,
    status_update: OrderItemStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    item = order_service.update_order_item_status(db, item_id, status_update.status, str(restaurant_id))
    notify_kds(background_tasks, str(restaurant_id), item.order_id, db)
    return item

@router.put("/{order_id}/payment-status", response_model=OrderRead)
def update_order_payment_status(
    order_id: UUID,
    status_update: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    return order_service.update_payment_status(db, order_id, status_update.payment_status, str(restaurant_id))

@router.delete("/{order_id}")
def delete_customer_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    return order_service.delete_order(db, order_id, str(restaurant_id))

@router.put("/{order_id}/items", response_model=OrderRead)
def update_order_items(
    order_id: UUID,
    items_update: OrderUpdateItems,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    order = order_service.update_order_items(db, order_id, items_update.items, str(restaurant_id))
    notify_kds(background_tasks, str(restaurant_id), order.id, db)
    return order

@router.get("/history/owner")
def get_owner_order_history(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    from models.order import Order
    from models.menu import MenuItem
    
    # Secure role check
    from api.api_v1.users import require_owner
    require_owner(token)

    from sqlalchemy.orm import joinedload
    orders = db.query(Order).options(joinedload(Order.items)).filter(Order.restaurant_id == restaurant_id).order_by(Order.created_at.desc()).limit(150).all()
    
    # Pre-fetch menu items to avoid N+1 queries
    menu_items = db.query(MenuItem).all() # Just fetching all here is fine since it's cached by SQLAlchemy or we can filter by restaurant
    menu_map = {str(item.id): item.name for item in menu_items}
    
    result = []
    from datetime import timezone
    for order in orders:
        items_data = []
        for oi in order.items:
            items_data.append({
                "name": menu_map.get(str(oi.menu_item_id), "Unknown Item"),
                "quantity": oi.quantity,
                "subtotal": oi.subtotal
            })
        
        # Format local time easily
        local_dt = order.created_at.astimezone() if order.created_at.tzinfo else order.created_at
        
        result.append({
            "id": str(order.id),
            "date": local_dt.strftime("%d %b"),
            "time": local_dt.strftime("%I:%M %p"),
            "day": local_dt.strftime("%A"),
            "customer_phone": order.customer_phone or "Walk-in",
            "customer_name": order.customer_name or "",
            "total_amount": order.total_amount,
            "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
            "items": items_data
        })
    return result

@router.post("/history/clear")
def clear_order_history(
    req: ClearHistoryRequest,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    user_id = token.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return order_service.clear_order_history(db, str(restaurant_id), req.password, user_id)

@router.websocket("/ws/kitchen/{restaurant_id}")
async def websocket_kitchen_endpoint(websocket: WebSocket, restaurant_id: str, token: str = Query(...)):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
    except InvalidTokenError:
        await websocket.close(code=1008)
        return

    await ws_manager.connect(websocket, restaurant_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Respond to pings if needed
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, restaurant_id)
