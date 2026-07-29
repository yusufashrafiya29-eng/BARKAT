import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("--- Crashing Order (rizwanpatel0903) ---")
res = db.execute(text("SELECT * FROM orders WHERE id = 'a83ec112-7769-4aa0-844a-aae075d9167f'")).fetchone()
for k, v in res._mapping.items():
    print(f"{k}: {v} (Type: {type(v)})")

print("--- Working Order (ashrafiya) ---")
res2 = db.execute(text("SELECT * FROM orders WHERE id = 'f31bf621-add5-4231-a125-70a7af0360e8'")).fetchone()
for k, v in res2._mapping.items():
    print(f"{k}: {v} (Type: {type(v)})")

db.close()
