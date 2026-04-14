from backend.db.session import engine
from sqlalchemy import text

def add_column():
    print("Connecting to DB...")
    with engine.begin() as conn:
        print("Executing ALTER TABLE...")
        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR;"))
    print("Column 'customer_phone' added successfully to 'orders' table.")

if __name__ == "__main__":
    add_column()
