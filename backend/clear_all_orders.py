import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("Setting status to SERVED and payment_status to PAID for all active orders of restaurant...")
from models.user import User
from models.order import Order
from models.order import OrderStatus

user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()

orders = db.query(Order).filter(
    Order.status.in_([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY]),
    Order.restaurant_id == user.restaurant_id
).all()

count = 0
for o in orders:
    print(f"Fixing Order: {o.id}")
    o.status = OrderStatus.SERVED
    o.payment_status = 'PAID'
    count += 1

db.commit()
print(f"Done. {count} active orders cleared.")

db.close()
