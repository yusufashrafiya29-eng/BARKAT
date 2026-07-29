import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def upgrade():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Add image_url_extra1 to menu_items table
        print("Adding image_url_extra1 column to menu_items...")
        cur.execute("""
            ALTER TABLE menu_items
            ADD COLUMN IF NOT EXISTS image_url_extra1 VARCHAR;
        """)

        # Add image_url_extra2 to menu_items table
        print("Adding image_url_extra2 column to menu_items...")
        cur.execute("""
            ALTER TABLE menu_items
            ADD COLUMN IF NOT EXISTS image_url_extra2 VARCHAR;
        """)

        # Add model_3d_active to menu_items table
        print("Adding model_3d_active column to menu_items...")
        cur.execute("""
            ALTER TABLE menu_items
            ADD COLUMN IF NOT EXISTS model_3d_active BOOLEAN DEFAULT TRUE;
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("Successfully ran multi-image and active toggle migrations!")

    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    upgrade()
