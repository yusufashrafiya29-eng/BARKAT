import sys
import os
import requests
import jwt
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User

db = SessionLocal()
users = db.query(User).filter(User.restaurant_id.isnot(None)).all()
db.close()

JWT_SECRET = "/u+Cxx2JNtomiKq84fkfANdeWud4ae2vwjSSAZNPRMgQZa3CvL0kDKVEcW7c6MY9fHoh/165AS+fbhS4hWWPUQ=="
ALGORITHM = "HS256"
BASE_URL = "https://barkat-8n7w.onrender.com/api/v1"

endpoints = [
    "/tables/",
    "/menu/categories",
    "/orders/waiter/active",
    "/settings/upi",
    "/reservations/"
]

for user in users:
    print(f"--- Testing user {user.email} ---")
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {"sub": str(user.id), "email": user.email, "role": user.role, "exp": expire}
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}
    
    for ep in endpoints:
        url = BASE_URL + ep
        try:
            res = requests.get(url, headers=headers)
            if res.status_code != 200:
                print(f"[{ep}] ERROR {res.status_code}: {res.text[:100]}")
        except Exception as e:
            print(f"[{ep}] Exception: {e}")
print("Done.")
