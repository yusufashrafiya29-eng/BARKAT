import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User
from models.order import Order
from sqlalchemy.orm import joinedload

db = SessionLocal()

emails = ["ashrafiya@gmail.com", "rizwanpatel0903@gmail.com", "faizanpatel659@gmail.com"]
for email in emails:
    user = db.query(User).filter(User.email == email).first()
    if user:
        orders = db.query(Order).options(joinedload(Order.items)).filter(Order.restaurant_id == user.restaurant_id).all()
        for o in orders:
            print(f"User: {email} | Order ID: {o.id} | Table: {o.table_id} | Type: {getattr(o, 'order_type', 'N/A')}")
            for item in o.items:
                print(f"  Item: {item.menu_item_id} | Qty: {item.quantity} | is_parcel: {getattr(item, 'is_parcel', 'N/A')}")

db.close()
