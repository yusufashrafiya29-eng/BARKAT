import sys
import os
import requests
import jwt
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User
from models.menu import MenuItem, Category

db = SessionLocal()
user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()

valid_item = db.query(MenuItem).join(Category).filter(
    Category.restaurant_id == user.restaurant_id,
    MenuItem.is_available == True
).first()

db.close()

if not valid_item:
    print("No valid item found!")
    sys.exit(1)

print(f"Testing with valid item: {valid_item.name} ({valid_item.id})")

JWT_SECRET = "/u+Cxx2JNtomiKq84fkfANdeWud4ae2vwjSSAZNPRMgQZa3CvL0kDKVEcW7c6MY9fHoh/165AS+fbhS4hWWPUQ=="
ALGORITHM = "HS256"
expire = datetime.utcnow() + timedelta(days=7)
token = jwt.encode({"sub": str(user.id), "email": user.email, "role": user.role, "exp": expire}, JWT_SECRET, algorithm=ALGORITHM)

url = "https://barkat-8n7w.onrender.com/api/v1/orders/"

payload = {
    "restaurant_id": str(user.restaurant_id),
    "table_id": "10618532-19bd-4e20-8c52-5801b6d36a16",
    "items": [
        {
            "menu_item_id": str(valid_item.id),
            "quantity": 1,
            "is_parcel": False
        }
    ],
    "source": "WAITER",
    "is_accepted": True,
    "order_type": "DINE_IN"
}

print(f"Sending payload to {url}...")
res = requests.post(url, json=payload, headers={"Authorization": f"Bearer {token}"})

print(f"Status: {res.status_code}")
if res.status_code == 200:
    print("SUCCESS! No 500 error!")
else:
    print(f"Response: {res.text}")
