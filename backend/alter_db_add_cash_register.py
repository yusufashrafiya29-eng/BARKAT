"""
Migration: Add cash_shifts and cash_transactions tables
Run: python alter_db_add_cash_register.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from db.session import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # ── cash_shifts ───────────────────────────────────────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cash_shifts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
                opened_by UUID NOT NULL REFERENCES users(id),
                closed_by UUID REFERENCES users(id),
                opening_balance FLOAT NOT NULL DEFAULT 0.0,
                closing_balance FLOAT,
                expected_balance FLOAT,
                net_sales FLOAT NOT NULL DEFAULT 0.0,
                total_cash_in FLOAT NOT NULL DEFAULT 0.0,
                total_cash_out FLOAT NOT NULL DEFAULT 0.0,
                status VARCHAR(10) NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','CLOSED')),
                notes TEXT,
                opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                closed_at TIMESTAMPTZ
            );
        """))
        print("[OK] cash_shifts table ready.")

        # ── cash_transactions ─────────────────────────────────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cash_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
                created_by UUID NOT NULL REFERENCES users(id),
                type VARCHAR(10) NOT NULL
                    CHECK (type IN ('CASH_IN','CASH_OUT')),
                amount FLOAT NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        print("[OK] cash_transactions table ready.")

        conn.commit()
        print("[OK] Cash Register migration complete.")

if __name__ == "__main__":
    run()
