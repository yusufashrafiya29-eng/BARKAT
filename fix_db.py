from backend.db.session import engine
from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE bills ADD COLUMN transaction_id VARCHAR NULL;"))
        print("Success! Added transaction_id to bills.")
except Exception as e:
    print("Error:", e)
