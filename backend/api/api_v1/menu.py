from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from api.deps import get_db, get_current_user_token, get_current_restaurant, get_current_user, get_optional_user_token
from schemas.menu import CategoryCreate, CategoryRead, MenuItemCreate, MenuItemRead, MenuItemUpdate
from services import menu_service
from uuid import UUID
from fastapi import HTTPException

router = APIRouter()

@router.get("/categories", response_model=List[CategoryRead])
def get_categories(
    restaurant_id: UUID = None,
    token: dict = Depends(get_optional_user_token), # Optional token check
    db: Session = Depends(get_db)
):
    """Fetch all active categories along with their menu items. Customers must pass restaurant_id. Waiters use token."""
    if not restaurant_id:
        # Fallback to token if no query param
        from fastapi import HTTPException
        if token and "email" in token:
            from models.user import User
            user = db.query(User).filter(User.email == token["email"]).first()
            if user and user.restaurant_id:
                restaurant_id = user.restaurant_id
            
    if not restaurant_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="restaurant_id is required")
        
    return menu_service.get_all_active_categories(db, str(restaurant_id))

@router.post("/categories", response_model=CategoryRead)
def create_category(
    cat_in: CategoryCreate, 
    db: Session = Depends(get_db), 
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """(Secure) Create a new category (Burgers, Drinks, etc)."""
    return menu_service.create_category(db, cat_in, str(restaurant_id))

@router.post("/items", response_model=MenuItemRead)
def create_menu_item(
    item_in: MenuItemCreate, 
    db: Session = Depends(get_db), 
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """(Secure) Create a new menu item inside a category."""
    return menu_service.create_menu_item(db, item_in, str(restaurant_id))

@router.put("/items/{item_id}", response_model=MenuItemRead)
def update_menu_item_details(
    item_id: str,
    item_update: MenuItemUpdate,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """(Secure) Update menu item (Owner only feature to toggle availability)."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    return menu_service.update_menu_item(db, item_id, item_update.model_dump(exclude_unset=True), str(restaurant_id))
