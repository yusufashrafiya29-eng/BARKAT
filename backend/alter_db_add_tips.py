import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.begin() as conn:
        print("Adding 'tip_amount' to 'orders' table...")
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN tip_amount FLOAT DEFAULT 0.0 NOT NULL;"))
            print("Successfully added 'tip_amount' column.")
        except Exception as e:
            print(f"Column 'tip_amount' might already exist or error: {e}")

if __name__ == "__main__":
    run_migration()
    print("Migration script finished.")
