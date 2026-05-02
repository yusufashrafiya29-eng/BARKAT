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
        print("Creating customers table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id UUID PRIMARY KEY,
                restaurant_id UUID NOT NULL REFERENCES restaurants(id),
                phone_number VARCHAR NOT NULL,
                name VARCHAR,
                email VARCHAR,
                loyalty_points INTEGER NOT NULL DEFAULT 0,
                total_spent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                total_visits INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT uix_restaurant_customer_phone UNIQUE (restaurant_id, phone_number)
            );
            CREATE INDEX IF NOT EXISTS ix_customers_phone_number ON customers (phone_number);
        """)
        print("Successfully created customers table.")
    except Exception as e:
        print(f"Error creating table: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    upgrade()
