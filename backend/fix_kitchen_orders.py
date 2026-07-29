import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("Setting status to SERVED for 1c1634c2...")
db.execute(text("UPDATE orders SET status = 'SERVED' WHERE id = '1c1634c2-de56-4b69-8dd6-df415bb2db08'"))
db.commit()

print("Done.")

db.close()
