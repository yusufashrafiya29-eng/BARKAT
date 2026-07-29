import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from schemas.order import OrderCreate, OrderItemCreate, OrderRead
from services.order_service import create_order
from models.user import User

db = SessionLocal()

user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()
payload = OrderCreate(
    restaurant_id=user.restaurant_id,
    table_id=uuid.UUID("10618532-19bd-4e20-8c52-5801b6d36a16"),
    items=[OrderItemCreate(menu_item_id=uuid.UUID("edcf22db-ea40-42f5-8153-2c3dbeff81db"), quantity=1, is_parcel=False)],
    source="WAITER",
    is_accepted=True,
    order_type="DINE_IN"
)

order = create_order(db, payload)
validated = OrderRead.model_validate(order)
dumped = validated.model_dump()
import pprint
pprint.pprint(dumped)

db.close()
