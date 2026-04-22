import os
from dotenv import load_dotenv
load_dotenv('../.env')
load_dotenv('.env')

from sqlalchemy import text
from db.session import engine

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR;"))
        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR;"))
        conn.commit()
        print("Successfully added razorpay columns to orders table.")
except Exception as e:
    print(f"Error (may already exist): {e}")

