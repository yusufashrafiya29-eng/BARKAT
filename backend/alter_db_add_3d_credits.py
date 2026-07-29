import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def upgrade():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Add model_3d_credits to restaurants table
        print("Adding model_3d_credits column to restaurants...")
        cur.execute("""
            ALTER TABLE restaurants
            ADD COLUMN IF NOT EXISTS model_3d_credits INTEGER DEFAULT 10;
        """)

        # Add model_3d_height to menu_items table
        print("Adding model_3d_height column to menu_items...")
        cur.execute("""
            ALTER TABLE menu_items
            ADD COLUMN IF NOT EXISTS model_3d_height FLOAT DEFAULT 12.0;
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("Successfully ran 3D credit and height migrations!")

    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    upgrade()
