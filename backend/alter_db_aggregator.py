"""
Migration: Add aggregator tracking fields
Run: python alter_db_aggregator.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from db.session import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN external_order_id VARCHAR;"))
            print("[OK] Added external_order_id to orders")
        except Exception as e:
            print("[SKIP] orders.external_order_id may already exist:", str(e).split('\n')[0])

        try:
            conn.execute(text("ALTER TABLE menu_items ADD COLUMN external_id VARCHAR;"))
            print("[OK] Added external_id to menu_items")
        except Exception as e:
            print("[SKIP] menu_items.external_id may already exist:", str(e).split('\n')[0])

        conn.commit()
        print("[OK] Aggregator migration complete.")

if __name__ == "__main__":
    run()
