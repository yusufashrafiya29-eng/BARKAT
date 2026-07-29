import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from schemas.order import OrderRead
from services.order_service import get_active_kitchen_orders
from models.user import User
from fastapi.encoders import jsonable_encoder

db = SessionLocal()

user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()

try:
    print("Fetching active kitchen orders...")
    orders = get_active_kitchen_orders(db, str(user.restaurant_id))
    print(f"Found {len(orders)} orders.")
    
    if len(orders) > 0:
        print("Validating first order with Pydantic...")
        validated = OrderRead.model_validate(orders[0])
        print("Validated successfully!")
        
        print("Dumping to dict...")
        dumped = validated.model_dump()
        print("Dumped successfully!")
        
        print("Serializing with jsonable_encoder...")
        serialized = jsonable_encoder(validated)
        print("Serialized successfully!")
        import pprint
        pprint.pprint(serialized)
except Exception as e:
    import traceback
    traceback.print_exc()

db.close()
