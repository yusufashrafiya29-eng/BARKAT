import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User
from api.api_v1.orders import pull_waiter_orders
from schemas.order import OrderRead
from fastapi.encoders import jsonable_encoder

db = SessionLocal()
user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()

try:
    orders = pull_waiter_orders(db=db, restaurant_id=user.restaurant_id)
    print("Found orders. Now serializing with jsonable_encoder...")
    serialized = jsonable_encoder([OrderRead.model_validate(o) for o in orders])
    print(f"Success! Serialized {len(serialized)} orders.")
except Exception as e:
    import traceback
    traceback.print_exc()

db.close()
