from sqlalchemy.orm import Session
from models.menu import Category, MenuItem
from schemas.menu import CategoryCreate, MenuItemCreate

def get_all_active_categories(db: Session, restaurant_id: str):
    # This automatically includes menu_items via SQLAlchemy relationships!
    return db.query(Category).filter(Category.is_active == True, Category.restaurant_id == restaurant_id).all()

def create_category(db: Session, cat_in: CategoryCreate, restaurant_id: str) -> Category:
    obj = Category(**cat_in.model_dump(), restaurant_id=restaurant_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def create_menu_item(db: Session, item_in: MenuItemCreate, restaurant_id: str) -> MenuItem:
    obj = MenuItem(**item_in.model_dump(), restaurant_id=restaurant_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_menu_item(db: Session, item_id: str, item_in: dict, restaurant_id: str) -> MenuItem:
    from fastapi import HTTPException
    obj = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.restaurant_id == restaurant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    for field, value in item_in.items():
        if value is not None:
            setattr(obj, field, value)
            
    db.commit()
    db.refresh(obj)
    return obj
