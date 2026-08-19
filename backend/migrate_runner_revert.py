import sys
from sqlalchemy import text
from db.session import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS runner_allowed_categories;"))
        db.commit()
        print("Migration complete!")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
