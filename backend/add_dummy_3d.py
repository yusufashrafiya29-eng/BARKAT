import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env vars
load_dotenv()

from models.menu import MenuItem

# Setup DB connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def add_dummy_3d():
    # Find any item that has an image
    items = db.query(MenuItem).filter(MenuItem.image_url != None).all()
    
    if not items:
        # If no items have an image, just get any item
        items = db.query(MenuItem).all()
        if not items:
            print("No menu items found in the database.")
            return

    # Take the first one
    target_item = items[0]
    
    # Popular sample GLB model (a hamburger or cake would be nice, but Astronaut is guaranteed to exist)
    dummy_glb_url = "https://modelviewer.dev/shared-assets/models/Astronaut.glb"
    
    target_item.model_3d_url = dummy_glb_url
    target_item.model_3d_task_id = "dummy_task_123"
    
    db.commit()
    print(f"Successfully added 3D AR Model to: {target_item.name}!")
    print(f"URL: {dummy_glb_url}")
    print("Now refresh your Customer Menu and click the AR button on this item!")

if __name__ == "__main__":
    add_dummy_3d()
