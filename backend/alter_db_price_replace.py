import os
from dotenv import load_dotenv
load_dotenv('../.env')
load_dotenv('.env')

from sqlalchemy import text
from db.session import engine

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE modifier_groups ADD COLUMN IF NOT EXISTS price_replaces_base BOOLEAN DEFAULT FALSE;"))
        conn.commit()
        print("Successfully added price_replaces_base column to modifier_groups table.")
except Exception as e:
    print(f"Error (may already exist): {e}")
