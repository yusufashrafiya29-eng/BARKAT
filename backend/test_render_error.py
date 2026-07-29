import sys
import os
import requests
import jwt
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == "rizwanpatel0903@gmail.com").first()
db.close()

JWT_SECRET = "/u+Cxx2JNtomiKq84fkfANdeWud4ae2vwjSSAZNPRMgQZa3CvL0kDKVEcW7c6MY9fHoh/165AS+fbhS4hWWPUQ=="
ALGORITHM = "HS256"
expire = datetime.utcnow() + timedelta(days=7)
token = jwt.encode({"sub": str(user.id), "email": user.email, "role": user.role, "exp": expire}, JWT_SECRET, algorithm=ALGORITHM)

url = "https://barkat-8n7w.onrender.com/api/v1/orders/waiter/active"
res = requests.get(url, headers={"Authorization": f"Bearer {token}"})

print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
