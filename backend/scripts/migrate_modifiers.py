import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db.session import SessionLocal
from sqlalchemy import text

def run_migration():
    db = SessionLocal()
    try:
        # 1. Create modifier_groups table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS modifier_groups (
                id UUID PRIMARY KEY,
                menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
                name VARCHAR NOT NULL,
                is_required BOOLEAN DEFAULT FALSE,
                min_selections INTEGER DEFAULT 0,
                max_selections INTEGER DEFAULT 1
            );
        """))
        
        # 2. Create modifiers table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS modifiers (
                id UUID PRIMARY KEY,
                group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
                name VARCHAR NOT NULL,
                price FLOAT DEFAULT 0.0,
                is_available BOOLEAN DEFAULT TRUE
            );
        """))
        
        # 3. Create order_item_modifiers table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS order_item_modifiers (
                id UUID PRIMARY KEY,
                order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
                modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
                price_at_order_time FLOAT NOT NULL
            );
        """))
        
        db.commit()
        print("Migration successful: Modifier tables created.")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
