from sqlalchemy.orm import Session
from models.menu import Category, MenuItem
from schemas.menu import CategoryCreate, MenuItemCreate

def get_all_active_categories(db: Session, restaurant_id: str):
    from sqlalchemy.orm import contains_eager, selectinload
    from models.menu import ModifierGroup
    return db.query(Category).outerjoin(MenuItem, 
        (MenuItem.category_id == Category.id) & (MenuItem.is_deleted == False)
    ).options(
        contains_eager(Category.menu_items).selectinload(MenuItem.recipe_ingredients),
        contains_eager(Category.menu_items).selectinload(MenuItem.modifier_groups).selectinload(ModifierGroup.modifiers)
    ).filter(
        Category.is_active == True, 
        Category.restaurant_id == restaurant_id
    ).all()

def create_category(db: Session, cat_in: CategoryCreate, restaurant_id: str) -> Category:
    obj = Category(**cat_in.model_dump(), restaurant_id=restaurant_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def create_menu_item(db: Session, item_in: MenuItemCreate, restaurant_id: str) -> MenuItem:
    from models.menu import ModifierGroup, Modifier
    
    item_data = item_in.model_dump()
    modifier_groups_data = item_data.pop('modifier_groups', None)
    
    obj = MenuItem(**item_data, restaurant_id=restaurant_id)
    db.add(obj)
    db.flush() # to get obj.id
    
    if modifier_groups_data:
        for mg_data in modifier_groups_data:
            modifiers_data = mg_data.pop('modifiers', [])
            new_mg = ModifierGroup(**mg_data, menu_item_id=obj.id)
            db.add(new_mg)
            db.flush()
            
            for m_data in modifiers_data:
                new_m = Modifier(**m_data, group_id=new_mg.id)
                db.add(new_m)
                
    db.commit()
    db.refresh(obj)
    return obj

def update_menu_item(db: Session, item_id: str, item_in: dict, restaurant_id: str) -> MenuItem:
    from fastapi import HTTPException
    from models.menu import ModifierGroup, Modifier
    
    obj = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.restaurant_id == restaurant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    modifier_groups_data = item_in.pop('modifier_groups', None)
    
    for field, value in item_in.items():
        if value is not None:
            setattr(obj, field, value)
            
    if modifier_groups_data is not None:
        # Delete existing modifier groups
        db.query(ModifierGroup).filter(ModifierGroup.menu_item_id == obj.id).delete()
        
        # Add new modifier groups and modifiers
        for mg_data in modifier_groups_data:
            mg_dict = mg_data if isinstance(mg_data, dict) else mg_data.model_dump()
            modifiers_data = mg_dict.pop('modifiers', [])
            
            new_mg = ModifierGroup(**mg_dict, menu_item_id=obj.id)
            db.add(new_mg)
            db.flush() # get new_mg.id
            
            for m_data in modifiers_data:
                m_dict = m_data if isinstance(m_data, dict) else m_data.model_dump()
                new_m = Modifier(**m_dict, group_id=new_mg.id)
                db.add(new_m)
            
    db.commit()
    db.refresh(obj)
    return obj

def delete_menu_item(db: Session, item_id: str, restaurant_id: str):
    from fastapi import HTTPException
    obj = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.restaurant_id == restaurant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Menu item not found")
        
    obj.is_deleted = True
    obj.is_available = False # Mark as out of stock too
    db.commit()
    return {"message": "Menu item removed from menu"}
