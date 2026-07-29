import sys
import os
import requests
import jwt
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == "faizanpatel659@gmail.com").first()
db.close()

JWT_SECRET = "/u+Cxx2JNtomiKq84fkfANdeWud4ae2vwjSSAZNPRMgQZa3CvL0kDKVEcW7c6MY9fHoh/165AS+fbhS4hWWPUQ=="
ALGORITHM = "HS256"
expire = datetime.utcnow() + timedelta(days=7)
token = jwt.encode({"sub": str(user.id), "email": user.email, "role": user.role, "exp": expire}, JWT_SECRET, algorithm=ALGORITHM)

url = "http://127.0.0.1:8001/api/v1/orders/"

payload = {
    "table_id": "10618532-19bd-4e20-8c52-5801b6d36a16",
    "items": [
        {
            "menu_item_id": "edcf22db-ea40-42f5-8153-2c3dbeff81db",
            "quantity": 1,
            "is_parcel": False
        }
    ],
    "source": "WAITER",
    "is_accepted": True,
    "order_type": "DINE_IN"
}

print("Sending payload to /orders/...")
res = requests.post(url, json=payload, headers={"Authorization": f"Bearer {token}"})

print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
