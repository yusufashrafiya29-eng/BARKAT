import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("Setting payment_status to PAID for 1c1634c2...")
db.execute(text("UPDATE orders SET payment_status = 'PAID' WHERE id = '1c1634c2-de56-4b69-8dd6-df415bb2db08'"))
db.commit()

print("Done. Let's verify active orders...")
from models.user import User
from api.api_v1.orders import pull_waiter_orders

user = db.query(User).filter(User.email == "rizwanpatel0903@gmail.com").first()
orders = pull_waiter_orders(db=db, restaurant_id=user.restaurant_id)
print(f"Active orders: {len(orders)}")

db.close()
