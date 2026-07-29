import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from api.deps import get_optional_user_token, get_current_user_token, get_current_restaurant
from uuid import UUID

client = TestClient(app)

from db.session import SessionLocal
from models.user import User

db = SessionLocal()
user = db.query(User).first()
db.close()

if not user:
    print("No user found in DB!")
    sys.exit(1)

# Mock tokens exactly like they would appear
app.dependency_overrides[get_optional_user_token] = lambda: {"email": user.email}
app.dependency_overrides[get_current_user_token] = lambda: {"email": user.email, "sub": str(user.id)}
app.dependency_overrides[get_current_restaurant] = lambda: user.restaurant_id

def run_tests():
    print(f"Testing for user email: {user.email}, restaurant: {user.restaurant_id}")
    
    # 1. Menu (no restaurant_id, relying on token)
    res = client.get("/api/v1/menu/categories")
    print("\n[GET /menu/categories]")
    print("Status:", res.status_code)
    if res.status_code != 200:
        print("Body:", res.text)
        
    res = client.get("/api/v1/orders/waiter/active")
    print("\n[GET /orders/waiter/active]")
    print("Status:", res.status_code)
    if res.status_code != 200:
        print("Body:", res.text)

if __name__ == "__main__":
    run_tests()
