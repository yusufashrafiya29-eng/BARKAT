import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from models.menu import MenuItem, Category
from models.restaurant import Restaurant

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

item = db.query(MenuItem).filter(MenuItem.model_3d_url != None).first()
if item:
    category = db.query(Category).filter(Category.id == item.category_id).first()
    if category:
        restaurant = db.query(Restaurant).filter(Restaurant.id == category.restaurant_id).first()
        print(f"Restaurant Name: {restaurant.name}")
        print(f"Table URL to test (replace tableId): The restaurant ID is {restaurant.id}")
        
        # Get a table ID for this restaurant
        from models.table import Table
        table = db.query(Table).filter(Table.restaurant_id == restaurant.id).first()
        if table:
            print(f"Table URL: /order/table/{table.id}")
        else:
            print("No tables found for this restaurant.")
    else:
        print("Category not found.")
else:
    print("No item with 3D model found.")
