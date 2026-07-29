import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User
from api.api_v1.orders import pull_waiter_orders
from schemas.order import OrderRead

db = SessionLocal()
users = db.query(User).filter(User.restaurant_id.isnot(None)).all()

for user in users:
    orders = pull_waiter_orders(db=db, restaurant_id=user.restaurant_id)
    print(f"User {user.email}: {len(orders)} active orders")

db.close()
