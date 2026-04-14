from backend.db.session import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'paymentstatus'")).fetchall()
    print("VALID PAYMENTSTATUS ENUMS:", result)
