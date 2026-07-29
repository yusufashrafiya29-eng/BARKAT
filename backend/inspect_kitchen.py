import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User
from models.order import Order
from sqlalchemy.orm import joinedload
from models.order import OrderStatus

db = SessionLocal()
user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()

orders = db.query(Order).options(joinedload(Order.items)).filter(
    Order.status.in_([OrderStatus.ACCEPTED, OrderStatus.PREPARING]),
    Order.restaurant_id == user.restaurant_id
).order_by(Order.created_at.asc()).all()

print(f"KITCHEN ACTIVE ORDERS: {len(orders)}")
for o in orders:
    print(f"Order ID: {o.id} | Status: {o.status} | Payment: {o.payment_status} | Table: {o.table_id} | Type: {getattr(o, 'order_type', 'N/A')}")
db.close()
