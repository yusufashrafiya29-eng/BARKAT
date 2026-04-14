from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.api.deps import get_db, get_current_user_token
from backend.schemas.menu import CategoryCreate, CategoryRead, MenuItemCreate, MenuItemRead, MenuItemUpdate
from backend.services import menu_service

router = APIRouter()

@router.get("/categories", response_model=List[CategoryRead])
def get_categories(db: Session = Depends(get_db)):
    """Fetch all active categories along with their menu items."""
    return menu_service.get_all_active_categories(db)

@router.post("/categories", response_model=CategoryRead)
def create_category(
    cat_in: CategoryCreate, 
    db: Session = Depends(get_db), 
    token: dict = Depends(get_current_user_token) # Secured by JWT
):
    """(Secure) Create a new category (Burgers, Drinks, etc)."""
    return menu_service.create_category(db, cat_in)

@router.post("/items", response_model=MenuItemRead)
def create_menu_item(
    item_in: MenuItemCreate, 
    db: Session = Depends(get_db), 
    token: dict = Depends(get_current_user_token) # Secured by JWT
):
    """(Secure) Create a new menu item inside a category."""
    return menu_service.create_menu_item(db, item_in)

@router.put("/items/{item_id}", response_model=MenuItemRead)
def update_menu_item_details(
    item_id: str,
    item_update: MenuItemUpdate,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """(Secure) Update menu item (Owner only feature to toggle availability)."""
    from fastapi import HTTPException
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    return menu_service.update_menu_item(db, item_id, item_update.model_dump(exclude_unset=True))
