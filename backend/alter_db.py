import os
from dotenv import load_dotenv
load_dotenv('../.env')
load_dotenv('.env')

from sqlalchemy import text
from db.session import engine

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE orders ADD COLUMN payment_status VARCHAR DEFAULT 'PENDING' NOT NULL;"))
        conn.commit()
        print("Successfully added payment_status column to orders table.")
except Exception as e:
    print(f"Error (may already exist): {e}")

