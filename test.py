from backend.db.session import SessionLocal
from backend.models.order import Order, OrderStatus
from backend.models.billing import Bill, PaymentStatus

db = SessionLocal()
try:
    orders = db.query(Order).outerjoin(Bill, Order.id == Bill.order_id).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]),
        (Bill.id.is_(None)) | (Bill.status != PaymentStatus.COMPLETED)
    ).order_by(Order.created_at.desc()).all()
    print("Success! Fetched", len(orders), "orders.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
