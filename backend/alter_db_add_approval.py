"""
Migration: Add is_approved column to users table.

Run: python alter_db_add_approval.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.session import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # Add is_approved column (default False for new staff)
        try:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE"
            ))
            print("✅ Column 'is_approved' added.")
        except Exception as e:
            print(f"⚠️  Column may already exist: {e}")

        # Auto-approve all existing OWNER accounts
        conn.execute(text(
            "UPDATE users SET is_approved = TRUE WHERE role = 'OWNER'"
        ))
        print("✅ All existing OWNERs approved.")

        # Auto-approve all existing verified WAITER/KITCHEN staff
        # (so existing staff don't get locked out)
        conn.execute(text(
            "UPDATE users SET is_approved = TRUE WHERE role != 'OWNER' AND is_verified = TRUE"
        ))
        print("✅ All previously verified staff auto-approved.")

        conn.commit()
        print("\n🎉 Migration complete!")

if __name__ == "__main__":
    run()
