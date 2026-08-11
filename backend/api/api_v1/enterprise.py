from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
from api.deps import get_db, get_current_restaurant
from models.enterprise import (
    ExpenseVoucher, Coupon, HappyHour, BogoRule,
    BranchOutlet, CentralStockItem, StockTransfer, AggregatorOrder
)

router = APIRouter()

# --- EXPENSES ---
@router.get("/expenses")
def get_expenses(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(ExpenseVoucher).filter(ExpenseVoucher.restaurant_id == restaurant_id).order_by(ExpenseVoucher.created_at.desc()).all()
    return [{
        "id": str(i.id),
        "voucher_id": i.voucher_id,
        "payee": i.payee,
        "category": i.category,
        "amount": i.amount,
        "paymentMode": i.payment_mode,
        "timestamp": i.timestamp,
        "remarks": i.remarks,
        "verifiedBy": i.verified_by
    } for i in items]

@router.post("/expenses")
def create_expense(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = ExpenseVoucher(
        restaurant_id=restaurant_id,
        voucher_id=data.get("id", data.get("voucher_id", "EXP-NEW")),
        payee=data.get("payee", ""),
        category=data.get("category", "Miscellaneous"),
        amount=float(data.get("amount", 0.0)),
        payment_mode=data.get("paymentMode", data.get("payment_mode", "CASH")),
        timestamp=data.get("timestamp", ""),
        remarks=data.get("remarks", ""),
        verified_by=data.get("verifiedBy", "Owner Portal")
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # Auto-sync with Cash Register if payment is CASH
    if item.payment_mode.upper() == "CASH":
        from services.cash_service import get_current_shift, add_transaction
        from models.cash_register import TransactionType
        shift = get_current_shift(db, str(restaurant_id))
        if shift:
            add_transaction(
                db=db,
                shift_id=str(shift.id),
                restaurant_id=str(restaurant_id),
                user_id=item.verified_by or "Owner Portal",
                type=TransactionType.CASH_OUT,
                amount=item.amount,
                description=f"Expense Voucher {item.voucher_id}: {item.payee} - {item.remarks}"
            )
            
    return {"status": "success", "id": str(item.id)}

@router.delete("/expenses/{id}")
def delete_expense(id: str, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    db.query(ExpenseVoucher).filter(ExpenseVoucher.id == id, ExpenseVoucher.restaurant_id == restaurant_id).delete()
    db.commit()
    return {"status": "deleted"}

# --- DISCOUNTS ---
@router.get("/coupons")
def get_coupons(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(Coupon).filter(Coupon.restaurant_id == restaurant_id).all()
    return [{
        "id": str(i.id),
        "code": i.code,
        "type": i.type,
        "value": i.value,
        "minOrder": i.min_order,
        "active": i.active,
        "expiry": i.expiry,
        "usageCount": i.usage_count
    } for i in items]

@router.post("/coupons")
def create_coupon(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = Coupon(
        restaurant_id=restaurant_id,
        code=data.get("code", "PROMO"),
        type=data.get("type", "PERCENTAGE"),
        value=float(data.get("value", 10)),
        min_order=float(data.get("minOrder", 0)),
        active=data.get("active", True),
        expiry=data.get("expiry", "2026-12-31"),
        usage_count=int(data.get("usageCount", 0))
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

@router.get("/happy-hours")
def get_happy_hours(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(HappyHour).filter(HappyHour.restaurant_id == restaurant_id).all()
    return [{
        "id": str(i.id),
        "title": i.title,
        "days": i.days.split(",") if i.days else [],
        "startTime": i.start_time,
        "endTime": i.end_time,
        "discountPercent": i.discount_percent,
        "category": i.category,
        "active": i.active
    } for i in items]

@router.post("/happy-hours")
def create_happy_hour(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = HappyHour(
        restaurant_id=restaurant_id,
        title=data.get("title", ""),
        days=",".join(data.get("days", [])) if isinstance(data.get("days"), list) else "Mon,Tue,Wed",
        start_time=data.get("startTime", "15:00"),
        end_time=data.get("endTime", "18:00"),
        discount_percent=float(data.get("discountPercent", 20)),
        category=data.get("category", "Beverages"),
        active=data.get("active", True)
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

@router.get("/bogo")
def get_bogo_rules(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(BogoRule).filter(BogoRule.restaurant_id == restaurant_id).all()
    return [{
        "id": str(i.id),
        "buyItem": i.buy_item,
        "buyQty": i.buy_qty,
        "getItem": i.get_item,
        "getQty": i.get_qty,
        "active": i.active
    } for i in items]

@router.post("/bogo")
def create_bogo_rule(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = BogoRule(
        restaurant_id=restaurant_id,
        buy_item=data.get("buyItem", ""),
        buy_qty=int(data.get("buyQty", 1)),
        get_item=data.get("getItem", ""),
        get_qty=int(data.get("getQty", 1)),
        active=data.get("active", True)
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

# --- FRANCHISE COMMISSARY ---
@router.get("/branches")
def get_branches(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(BranchOutlet).filter(BranchOutlet.restaurant_id == restaurant_id).all()
    return [{
        "id": str(i.id),
        "branch_code": i.branch_code,
        "name": i.name,
        "location": i.location,
        "manager": i.manager,
        "status": i.status,
        "today_sales": i.today_sales,
        "health_score": i.health_score
    } for i in items]

@router.post("/branches")
def create_branch(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = BranchOutlet(
        restaurant_id=restaurant_id,
        branch_code=data.get("id", data.get("branch_code", "BR-NEW")),
        name=data.get("name", ""),
        location=data.get("location", ""),
        manager=data.get("manager", ""),
        status=data.get("status", "Online (Connected)"),
        today_sales=data.get("today_sales", "₹0"),
        health_score=data.get("health_score", "100%")
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

@router.delete("/branches/{id}")
def delete_branch(id: str, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    db.query(BranchOutlet).filter(BranchOutlet.id == id, BranchOutlet.restaurant_id == restaurant_id).delete()
    db.commit()
    return {"status": "deleted"}

@router.get("/stock")
def get_central_stock(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(CentralStockItem).filter(CentralStockItem.restaurant_id == restaurant_id).all()
    return [{
        "id": str(i.id),
        "item_code": i.item_code,
        "name": i.name,
        "total_batch": i.total_batch,
        "unit": i.unit,
        "batch_date": i.batch_date,
        "expiry": i.expiry,
        "temperature": i.temperature,
        "qc_status": i.qc_status
    } for i in items]

@router.post("/stock")
def create_central_stock(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = CentralStockItem(
        restaurant_id=restaurant_id,
        item_code=data.get("id", data.get("item_code", "STK-NEW")),
        name=data.get("name", ""),
        total_batch=float(data.get("total_batch", 100)),
        unit=data.get("unit", "Kg"),
        batch_date=data.get("batch_date", ""),
        expiry=data.get("expiry", ""),
        temperature=data.get("temperature", "4°C Chilled"),
        qc_status=data.get("qc_status", "Passed (Chef Approved 🟢)")
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

@router.delete("/stock/{id}")
def delete_central_stock(id: str, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    db.query(CentralStockItem).filter(CentralStockItem.id == id, CentralStockItem.restaurant_id == restaurant_id).delete()
    db.commit()
    return {"status": "deleted"}

@router.get("/transfers")
def get_transfers(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(StockTransfer).filter(StockTransfer.restaurant_id == restaurant_id).all()
    return [{
        "id": str(i.id),
        "transfer_code": i.transfer_code,
        "voucher_number": i.voucher_number,
        "source_kitchen": i.source_kitchen,
        "destination_branch": i.destination_branch,
        "item_name": i.item_name,
        "quantity": i.quantity,
        "unit": i.unit,
        "dispatched_at": i.dispatched_at,
        "status": i.status,
        "driver_name": i.driver_name
    } for i in items]

@router.post("/transfers")
def create_transfer(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = StockTransfer(
        restaurant_id=restaurant_id,
        transfer_code=data.get("id", data.get("transfer_code", "TR-NEW")),
        voucher_number=data.get("voucher_number", "WTV-NEW"),
        source_kitchen=data.get("source_kitchen", "Central Commissary (Base Kitchen HQ)"),
        destination_branch=data.get("destination_branch", ""),
        item_name=data.get("item_name", ""),
        quantity=float(data.get("quantity", 0)),
        unit=data.get("unit", ""),
        dispatched_at=data.get("dispatched_at", ""),
        status=data.get("status", "IN_TRANSIT"),
        driver_name=data.get("driver_name", "")
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

@router.put("/transfers/{id}/receive")
def mark_transfer_received(id: str, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    t = db.query(StockTransfer).filter(StockTransfer.id == id, StockTransfer.restaurant_id == restaurant_id).first()
    if t:
        t.status = "RECEIVED"
        db.commit()
    return {"status": "updated"}

# --- AGGREGATORS ---
@router.get("/aggregators")
def get_aggregators(db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    items = db.query(AggregatorOrder).filter(AggregatorOrder.restaurant_id == restaurant_id).all()
    return [{
        "id": i.order_id, # return order_id as id for frontend matching e.g. ZOM-84921
        "db_id": str(i.id),
        "platform": i.platform,
        "customer_name": i.customer_name,
        "items_summary": i.items_summary,
        "gross_amount": i.gross_amount,
        "platform_commission_rate": i.platform_commission_rate,
        "ad_deduction": i.ad_deduction,
        "gst_on_commission": i.gst_on_commission,
        "net_payout": i.net_payout,
        "rider_name": i.rider_name,
        "rider_status": i.rider_status,
        "eta": i.eta,
        "status": i.status,
        "ordered_at": i.ordered_at
    } for i in items]

@router.post("/aggregators")
def create_aggregator_order(data: dict, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    item = AggregatorOrder(
        restaurant_id=restaurant_id,
        order_id=data.get("id", "ON-NEW"),
        platform=data.get("platform", "Zomato"),
        customer_name=data.get("customer_name", ""),
        items_summary=data.get("items_summary", ""),
        gross_amount=float(data.get("gross_amount", 0)),
        platform_commission_rate=float(data.get("platform_commission_rate", 0)),
        ad_deduction=float(data.get("ad_deduction", 0)),
        gst_on_commission=float(data.get("gst_on_commission", 0)),
        net_payout=float(data.get("net_payout", 0)),
        rider_name=data.get("rider_name", "Unassigned"),
        rider_status=data.get("rider_status", "ASSIGNED_WAITING"),
        eta=data.get("eta", "Arriving soon"),
        status=data.get("status", "NEW"),
        ordered_at=data.get("ordered_at", "Just Now")
    )
    db.add(item)
    db.commit()
    return {"status": "success", "id": str(item.id)}

@router.delete("/aggregators/{order_id}")
def delete_aggregator_order(order_id: str, db: Session = Depends(get_db), restaurant_id: UUID = Depends(get_current_restaurant)):
    db.query(AggregatorOrder).filter(AggregatorOrder.order_id == order_id, AggregatorOrder.restaurant_id == restaurant_id).delete()
    db.commit()
    return {"status": "deleted"}
