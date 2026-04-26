import asyncio
from db.session import SessionLocal
from sqlalchemy import text

async def alter_db():
    print("Connecting to DB...")
    db = SessionLocal()
    try:
        # Add to restaurants table
        print("Altering restaurants table...")
        db.execute(text("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS gstin VARCHAR;"))
        db.execute(text("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS fssai VARCHAR;"))
        
        # Add to menu_items table
        print("Altering menu_items table...")
        db.execute(text("ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tax_rate FLOAT DEFAULT 5.0;"))
        
        # Add to orders table
        print("Altering orders table...")
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount FLOAT DEFAULT 0.0;"))
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount FLOAT DEFAULT 0.0;"))
        
        db.commit()
        print("Database schema updated successfully!")
        
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(alter_db())
