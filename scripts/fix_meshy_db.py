import os
import requests
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# DB connection
DATABASE_URL = "postgresql://postgres:yusufashrafiya@db.fidlgjegcxoyyeaywefz.supabase.co:5432/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Supabase Storage connection
from supabase import create_client, Client
SUPABASE_URL = "https://fidlgjegcxoyyeaywefz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZGxnamVnY3hveXllYXl3ZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDgxMTMsImV4cCI6MjA5MDY4NDExM30.ZrmCwcpFB1VPr9K_uITC3UgEPH2nzxu76yXFoE-L0CM"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fix_db():
    db = SessionLocal()
    res = db.execute(text("SELECT id, model_3d_url FROM menu_items WHERE model_3d_url LIKE '%assets.meshy.ai%'"))
    for row in res:
        item_id = row[0]
        file_url = row[1]
        print(f"Fixing item {item_id} with URL {file_url[:50]}...")
        
        try:
            resp = requests.get(file_url)
            if resp.status_code == 200:
                file_name = f"model_{uuid.uuid4().hex}.glb"
                supabase.storage.from_('logos').upload(
                    path=f"models/{file_name}",
                    file=resp.content,
                    file_options={"content-type": "model/gltf-binary"}
                )
                permanent_url = supabase.storage.from_('logos').get_public_url(f"models/{file_name}")
                
                db.execute(
                    text("UPDATE menu_items SET model_3d_url = :url WHERE id = :id"),
                    {"url": permanent_url, "id": item_id}
                )
                db.commit()
                print(f"Updated item {item_id} to {permanent_url}")
            else:
                print(f"Failed to download from Meshy: {resp.status_code}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_db()
