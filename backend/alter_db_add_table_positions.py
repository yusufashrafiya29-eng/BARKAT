import sys
from sqlalchemy import text
from db.session import SessionLocal

def upgrade():
    db = SessionLocal()
    try:
        # Check if columns exist
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tables'"))
        columns = [row[0] for row in result]
        
        if 'position_x' not in columns:
            db.execute(text("ALTER TABLE tables ADD COLUMN position_x FLOAT DEFAULT 0.0"))
            print("Added position_x to tables")
            
        if 'position_y' not in columns:
            db.execute(text("ALTER TABLE tables ADD COLUMN position_y FLOAT DEFAULT 0.0"))
            print("Added position_y to tables")
            
        db.commit()
        print("Database updated successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    upgrade()
