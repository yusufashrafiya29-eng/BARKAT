import asyncio
from sqlalchemy import text
from db.session import SessionLocal

async def alter_db():
    db = SessionLocal()
    try:
        print("Altering restaurants table...")
        # Add is_approved column to restaurants table
        db.execute(text("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE NOT NULL"))
        
        print("Altering UserRole enum in users table...")
        # Add MANAGER and SUPERADMIN to enum type UserRole
        db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'MANAGER'"))
        db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPERADMIN'"))
        
        # Approve existing restaurants so they don't get locked out
        db.execute(text("UPDATE restaurants SET is_approved = TRUE"))
        
        db.commit()
        
        # Start a new transaction to use the newly created ENUM value
        print("Granting SUPERADMIN role to first user...")
        db.execute(text("UPDATE users SET role = 'SUPERADMIN' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)"))
        
        db.commit()
        print("Database altered successfully!")
    except Exception as e:
        print(f"Error altering database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(alter_db())
