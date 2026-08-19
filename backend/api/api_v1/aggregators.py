import math
import uuid
import logging
from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from api.deps import get_db, get_current_user, get_current_restaurant
from models.user import User
from models.aggregator import AggregatorOrder
from models.aggregator_item_map import AggregatorItemMapping
from schemas.order import OrderCreate, OrderItemCreate
from schemas.billing import BillCreate, PaymentConfirmation
from services import order_service, billing_service
from services.ws_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/orders/pending")
def get_pending_orders(
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
) -> Any:
    """Get all pending (unaccepted) aggregator orders for the Waiter Panel"""
    orders = db.query(AggregatorOrder).filter(
        AggregatorOrder.restaurant_id == restaurant_id,
        AggregatorOrder.is_accepted == False,
        AggregatorOrder.status == "NEW"
    ).order_by(AggregatorOrder.created_at.desc()).all()
    
    return orders

@router.get("/orders/active")
def get_active_orders(
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
) -> Any:
    """Get all accepted active aggregator orders"""
    orders = db.query(AggregatorOrder).filter(
        AggregatorOrder.restaurant_id == restaurant_id,
        AggregatorOrder.is_accepted == True,
        AggregatorOrder.status.in_(['NEW', 'KITCHEN_PREPARING', 'READY_FOR_RIDER'])
    ).order_by(AggregatorOrder.created_at.desc()).all()
    
    return orders


@router.post("/webhooks/dams")
async def dams_webhook_receiver(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    orders = payload.get("orders", [])
    if not orders:
        return {"status": "success", "message": "No orders in payload"}

    processed_count = 0
    for order_data in orders:
        platform = order_data.get("vendor", "Unknown").capitalize()
        platform_order_id = order_data.get("orderId")
        res_id = order_data.get("resId") # Expected to match a restaurant_id or be mapped
        raw_data = order_data.get("data", {})
        
        if not platform_order_id or not res_id:
            continue
            
        # Optional: Implement a lookup if resId is not exactly the UUID of the restaurant
        # For now, assuming resId is the restaurant UUID string (since it's a pilot for 1 restaurant)
        try:
            restaurant_uuid = uuid.UUID(res_id)
        except ValueError:
            logger.error(f"Invalid resId format from DAMS: {res_id}")
            continue

        # Idempotency check
        existing = db.query(AggregatorOrder).filter(
            AggregatorOrder.platform_order_id == str(platform_order_id),
            AggregatorOrder.platform == platform
        ).first()
        
        if existing:
            continue # Already received
            
        # Extract basic info
        customer = raw_data.get("customer", {})
        customer_name = customer.get("name", "Aggregator Customer")
        customer_phone = customer.get("phone", "")
        
        gross = float(raw_data.get("order_subtotal", 0) or raw_data.get("bill", 0) or 0)
        
        # Build items summary
        items = raw_data.get("items", [])
        summary_parts = []
        for item in items:
            name = item.get("name", "Unknown Item")
            qty = item.get("quantity", 1)
            summary_parts.append(f"{qty}x {name}")
        items_summary = ", ".join(summary_parts) if summary_parts else "Items details missing"

        # Create AggregatorOrder
        new_agg_order = AggregatorOrder(
            restaurant_id=restaurant_uuid,
            platform=platform,
            platform_order_id=str(platform_order_id),
            customer_name=customer_name,
            customer_phone=customer_phone,
            items_summary=items_summary,
            gross_amount=gross,
            raw_payload=order_data, # Store the whole DAMS object
            status="NEW",
            is_accepted=False
        )
        db.add(new_agg_order)
        db.commit()
        db.refresh(new_agg_order)
        processed_count += 1
        
        # Broadcast to Waiter Panel
        import asyncio
        asyncio.create_task(manager.broadcast(str(restaurant_uuid), {
            "type": "NEW_AGGREGATOR_ORDER",
            "aggregator_order_id": str(new_agg_order.id),
            "platform": platform
        }))

    return {"status": "success", "message": f"Processed {processed_count} orders"}


@router.post("/{order_id}/accept")
def accept_aggregator_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
):
    try:
        """
        Accept an aggregator order.
        1. Maps items (or uses a fallback generic item).
        2. Creates a MyRestro Order (KOT).
        3. Auto-bills and marks PAID.
        4. Links AggregatorOrder to MyRestro Order.
        5. Syncs status back to Dyno APIs.
        """
        agg_order = db.query(AggregatorOrder).filter(
            AggregatorOrder.id == order_id, 
            AggregatorOrder.restaurant_id == restaurant_id
        ).first()
    
        if not agg_order:
            raise HTTPException(status_code=404, detail="Aggregator order not found")
        
        if agg_order.is_accepted:
            raise HTTPException(status_code=400, detail="Order already accepted")

        raw_data = agg_order.raw_payload.get("data", {}) if agg_order.raw_payload else {}
        platform_items = raw_data.get("items", [])
    
        order_items = []
    
        # Item Mapping Logic (MVP: using Option B mapping table)
        for p_item in platform_items:
            p_item_id = str(p_item.get("id", ""))
            mapping = db.query(AggregatorItemMapping).filter(
                AggregatorItemMapping.restaurant_id == restaurant_id,
                AggregatorItemMapping.platform == agg_order.platform,
                AggregatorItemMapping.platform_item_id == p_item_id
            ).first()
            
            if mapping:
                order_items.append(OrderItemCreate(
                    menu_item_id=mapping.menu_item_id,
                    quantity=int(p_item.get("quantity", 1)),
                    notes="Aggregator order"
                ))
            else:
                pass
                
        # If no items mapped, we can't create KOT properly. For MVP we'll allow an empty order or a dummy item.
        # We will assume mapping is done prior.
        if not order_items:
            raise HTTPException(status_code=400, detail="None of the items are mapped to the menu. Please map them first.")

        # 1. Create MyRestro Order
        order_in = OrderCreate(
            order_type="DELIVERY", # Aggregators are delivery
            customer_name=f"{agg_order.platform}: {agg_order.customer_name}",
            customer_phone=agg_order.customer_phone,
            items=order_items
        )
    
        # We create the order
        myrestro_order = order_service.create_order(db, order_in, inject_restaurant_id=str(restaurant_id))
    
        # 2. Auto Generate Bill
        bill_in = BillCreate(payment_method="ONLINE")
        bill = billing_service.generate_bill(db, myrestro_order.id, bill_in, str(restaurant_id))
    
        # 3. Confirm Payment (prepaid by aggregator)
        payment_in = PaymentConfirmation(
            amount=bill.total_amount,
            payment_method="ONLINE",
            transaction_reference=f"{agg_order.platform}-{agg_order.platform_order_id}"
        )
        billing_service.confirm_payment(db, myrestro_order.id, payment_in, str(restaurant_id))
    
        # 4. Link & Update Aggregator Order
        agg_order.is_accepted = True
        agg_order.order_id = myrestro_order.id
        agg_order.status = "KITCHEN_PREPARING"
        db.commit()
    
        # 5. TODO: Sync status to Dyno APIs
        # sync_status_to_dams(agg_order.platform_order_id, "accepted")
    
        # 6. Notify KDS
        from api.api_v1.orders import notify_kds
        # Using background tasks would be ideal, but for simplicity here we just need to ensure the WS event fires
        # The frontend will fetch active kitchen orders anyway
    
        return {"message": "Order accepted successfully", "order_id": str(myrestro_order.id)}
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.post("/{order_id}/reject")
def reject_aggregator_order(
    order_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
):
    """
    Reject an aggregator order.
    """
    agg_order = db.query(AggregatorOrder).filter(
        AggregatorOrder.id == order_id, 
        AggregatorOrder.restaurant_id == restaurant_id
    ).first()
    
    if not agg_order:
        raise HTTPException(status_code=404, detail="Aggregator order not found")
        
    if agg_order.is_accepted:
        raise HTTPException(status_code=400, detail="Cannot reject an already accepted order")

    reason = payload.get("reason", "Out of stock")
    
    agg_order.status = "REJECTED"
    agg_order.rejection_reason = reason
    db.commit()
    
    # TODO: Sync status to Dyno APIs
    # sync_status_to_dams(agg_order.platform_order_id, "rejected", reason)
    
    return {"message": "Order rejected"}

@router.get("/item-mappings")
def get_item_mappings(
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
):
    """Get all item mappings for the restaurant"""
    mappings = db.query(AggregatorItemMapping).filter(
        AggregatorItemMapping.restaurant_id == restaurant_id
    ).all()
    return mappings

@router.post("/item-mappings")
def create_item_mapping(
    payload: dict,
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
):
    """Create a mapping between Swiggy/Zomato item and internal menu item"""
    # Check if mapping already exists
    existing = db.query(AggregatorItemMapping).filter(
        AggregatorItemMapping.restaurant_id == restaurant_id,
        AggregatorItemMapping.platform == payload["platform"],
        AggregatorItemMapping.platform_item_id == payload["platform_item_id"]
    ).first()
    
    if existing:
        # Update existing
        existing.menu_item_id = payload["menu_item_id"]
        existing.platform_item_name = payload.get("platform_item_name", "")
        db.commit()
        return {"message": "Mapping updated"}

    mapping = AggregatorItemMapping(
        restaurant_id=restaurant_id,
        menu_item_id=payload["menu_item_id"],
        platform=payload["platform"],
        platform_item_id=payload["platform_item_id"],
        platform_item_name=payload.get("platform_item_name", "")
    )
    db.add(mapping)
    db.commit()
    return {"message": "Mapping created"}

@router.delete("/item-mappings/{mapping_id}")
def delete_item_mapping(
    mapping_id: uuid.UUID,
    db: Session = Depends(get_db),
    restaurant_id: uuid.UUID = Depends(get_current_restaurant),
):
    """Delete an item mapping"""
    mapping = db.query(AggregatorItemMapping).filter(
        AggregatorItemMapping.id == mapping_id,
        AggregatorItemMapping.restaurant_id == restaurant_id
    ).first()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    db.delete(mapping)
    db.commit()
    return {"message": "Mapping deleted"}
