import os
import sys
import asyncio
from sqlalchemy import text
from db.session import engine

def apply_migrations():
    print("Starting Multi-Tender & Split Billing DB Migration...")
    with engine.connect() as conn:
        # 1. Create PaymentTransactions table
        print("Creating 'payment_transactions' table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
                restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
                amount DOUBLE PRECISION NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                transaction_reference VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("Successfully created 'payment_transactions' table.")

        # 2. Add amount_paid to bills if not exists
        print("Checking if 'amount_paid' exists in 'bills'...")
        try:
            conn.execute(text("ALTER TABLE bills ADD COLUMN amount_paid DOUBLE PRECISION NOT NULL DEFAULT 0.0"))
            print("Successfully added 'amount_paid' column to 'bills'.")
        except Exception as e:
            if 'duplicate column name' in str(e).lower() or 'already exists' in str(e).lower():
                print("'amount_paid' column already exists.")
            else:
                print(f"Error adding 'amount_paid' to bills: {e}")

        conn.commit()
    print("Migration completed successfully!")

if __name__ == "__main__":
    apply_migrations()
