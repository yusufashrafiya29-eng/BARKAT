from backend.db.session import SessionLocal
from backend.models.user import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Verified: {u.is_verified}, Role: {u.role}")
finally:
    db.close()
