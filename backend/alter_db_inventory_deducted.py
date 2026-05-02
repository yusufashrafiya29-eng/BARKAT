import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def upgrade():
    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        print("Adding is_inventory_deducted to orders...")
        cursor.execute("ALTER TABLE orders ADD COLUMN is_inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE;")
        print("Successfully added is_inventory_deducted column.")
    except Exception as e:
        print(f"Error adding column: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    upgrade()
