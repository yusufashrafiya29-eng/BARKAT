import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.begin() as conn:
        print("Adding 'station' to 'categories' table...")
        try:
            conn.execute(text("ALTER TABLE categories ADD COLUMN station VARCHAR DEFAULT 'Kitchen';"))
            print("Successfully added 'station' column.")
        except Exception as e:
            print(f"Column 'station' might already exist or error: {e}")

        print("Adding 'status' to 'order_items' table...")
        try:
            conn.execute(text("ALTER TABLE order_items ADD COLUMN status VARCHAR DEFAULT 'PENDING' NOT NULL;"))
            print("Successfully added 'status' column.")
        except Exception as e:
            print(f"Column 'status' might already exist or error: {e}")

        print("Creating 'recipe_ingredients' table...")
        try:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS recipe_ingredients (
                id UUID PRIMARY KEY,
                menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
                stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
                quantity FLOAT NOT NULL,
                unit VARCHAR NOT NULL
            );
            """))
            print("Successfully created 'recipe_ingredients' table.")
        except Exception as e:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    run_migration()
    print("Migration script finished.")
