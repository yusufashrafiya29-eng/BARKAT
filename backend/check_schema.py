import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("--- Tables ---")
res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tables'"))
print([r[0] for r in res])

print("--- Menu Items ---")
res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='menu_items'"))
print([r[0] for r in res])

print("--- Restaurants ---")
res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='restaurants'"))
print([r[0] for r in res])

print("--- Orders ---")
res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='orders'"))
print([r[0] for r in res])

print("--- Order Items ---")
res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='order_items'"))
print([r[0] for r in res])

db.close()
