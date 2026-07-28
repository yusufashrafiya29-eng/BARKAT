import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from core.config import settings

def alter_db():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Starting DB migration for Parcel/Takeaway features...")
        
        # 1. Add order_type to orders
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN order_type VARCHAR NOT NULL DEFAULT 'DINE_IN';"))
            print("Added order_type to orders.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column order_type already exists.")
            else:
                print(f"Error adding order_type: {e}")

        # 2. Make table_id nullable on orders
        try:
            conn.execute(text("ALTER TABLE orders ALTER COLUMN table_id DROP NOT NULL;"))
            print("Dropped NOT NULL constraint on orders.table_id.")
        except Exception as e:
            print(f"Error modifying table_id on orders: {e}")

        # 3. Add is_parcel to order_items
        try:
            conn.execute(text("ALTER TABLE order_items ADD COLUMN is_parcel BOOLEAN NOT NULL DEFAULT FALSE;"))
            print("Added is_parcel to order_items.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column is_parcel already exists.")
            else:
                print(f"Error adding is_parcel: {e}")

        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    alter_db()
