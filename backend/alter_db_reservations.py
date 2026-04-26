import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from core.config import settings

def alter_db():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Starting DB migration for Reservations...")
        
        # 1. Add advance_booking_fee to restaurants
        try:
            conn.execute(text('ALTER TABLE restaurants ADD COLUMN advance_booking_fee DOUBLE PRECISION NOT NULL DEFAULT 0.0;'))
            print("Added advance_booking_fee to restaurants.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column advance_booking_fee already exists.")
            else:
                print(f"Error adding advance_booking_fee: {e}")

        # 2. Create reservations table
        try:
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS reservations (
                    id UUID PRIMARY KEY,
                    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
                    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
                    customer_name VARCHAR NOT NULL,
                    customer_phone VARCHAR NOT NULL,
                    reservation_date DATE NOT NULL,
                    reservation_time TIME NOT NULL,
                    guest_count INTEGER NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'CONFIRMED',
                    payment_status VARCHAR NOT NULL DEFAULT 'NONE',
                    advance_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                    razorpay_order_id VARCHAR,
                    razorpay_payment_id VARCHAR,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            '''))
            print("Created reservations table.")
        except Exception as e:
            print(f"Error creating reservations table: {e}")

        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    alter_db()
