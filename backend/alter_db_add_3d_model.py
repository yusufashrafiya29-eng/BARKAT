import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def upgrade():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Add 3D model fields
        print("Adding 3D model columns to menu_items...")
        cur.execute("""
            ALTER TABLE menu_items
            ADD COLUMN IF NOT EXISTS model_3d_url VARCHAR,
            ADD COLUMN IF NOT EXISTS model_3d_task_id VARCHAR;
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("Successfully added 3D model columns!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    upgrade()
