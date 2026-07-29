import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:yusufashrafiya@db.fidlgjegcxoyyeaywefz.supabase.co:5432/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_models():
    db = SessionLocal()
    res = db.execute("SELECT id, name, model_3d_url, model_3d_task_id FROM menu_items WHERE model_3d_task_id IS NOT NULL OR model_3d_url IS NOT NULL")
    for row in res:
        print(f"ID: {row[0]}, Name: {row[1]}, Task: {row[3]}, URL: {row[2]}")
        
if __name__ == "__main__":
    check_models()
