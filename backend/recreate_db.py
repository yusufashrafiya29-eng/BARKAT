import os
import sys

# Ensure we can import the backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.session import engine, Base
import models  # This will trigger importing __init__.py which has all models

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables with updated schema...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_database()
