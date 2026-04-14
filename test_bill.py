from backend.db.session import SessionLocal
from backend.models.order import Order
from backend.services.billing_service import generate_bill
from backend.schemas.billing import BillCreate

db = SessionLocal()
try:
    order = db.query(Order).first()
    if order:
        bill_in = BillCreate(payment_method="CASH", discount_amount=0.0)
        bill = generate_bill(db, order.id, bill_in)
        print("Success!", bill.total_amount)
    else:
        print("No orders found")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
