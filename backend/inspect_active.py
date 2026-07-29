import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User
from api.api_v1.orders import pull_waiter_orders

db = SessionLocal()
user = db.query(User).filter(User.email == "rizwanpatel0903@gmail.com").first()

orders = pull_waiter_orders(db=db, restaurant_id=user.restaurant_id)
for o in orders:
    print(f"ACTIVE ORDER ID: {o.id}")
    for k, v in o.__dict__.items():
        if not k.startswith('_'):
            print(f"{k}: {v}")
db.close()
