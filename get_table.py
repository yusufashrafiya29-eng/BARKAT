import os
import sys

# Add backend to path
sys.path.append(os.path.abspath('backend'))

from backend.db.session import SessionLocal
from backend.models.table import Table

def get_table():
    db = SessionLocal()
    table = db.query(Table).first()
    if table:
        print(f"FOUND_TABLE_ID: {table.id}")
    else:
        print("FOUND_TABLE_ID: NONE")
    db.close()

if __name__ == "__main__":
    get_table()
