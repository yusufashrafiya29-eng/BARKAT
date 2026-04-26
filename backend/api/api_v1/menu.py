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

@router.delete("/items/{item_id}")
def delete_menu_item(
    item_id: str,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """(Secure) Delete menu item (Owner only feature)."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    return menu_service.delete_menu_item(db, item_id, str(restaurant_id))


from fastapi import File, UploadFile
@router.post("/items/{item_id}/upload-image", response_model=MenuItemRead)
def upload_menu_item_image(
    item_id: str,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """(Secure) Upload an image for a menu item. Owner only."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
        
    # verify item belongs to restaurant
    from models.menu import MenuItem
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.restaurant_id == restaurant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
        
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No valid image provided")
        
    from db.supabase import supabase_client
    import uuid
    file_ext = image.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    
    image_content = image.file.read()
    res = supabase_client.storage.from_('logos').upload(
        path=f"menu/{file_name}",
        file=image_content,
        file_options={"content-type": image.content_type}
    )
    
    public_url = supabase_client.storage.from_('logos').get_public_url(f"menu/{file_name}")
    
    item.image_url = public_url
    db.commit()
    db.refresh(item)
    return item

from schemas.menu import RecipeIngredientCreate, RecipeIngredientRead
@router.post("/items/{item_id}/recipe", response_model=List[RecipeIngredientRead])
def update_menu_item_recipe(
    item_id: str,
    ingredients: List[RecipeIngredientCreate],
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """(Secure) Set the BOM recipe for a menu item. Replaces existing recipe."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
        
    from models.menu import MenuItem, RecipeIngredient
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.restaurant_id == restaurant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
        
    # Delete old recipe
    db.query(RecipeIngredient).filter(RecipeIngredient.menu_item_id == item_id).delete()
    
    # Add new recipe
    new_ingredients = []
    for ing in ingredients:
        new_ing = RecipeIngredient(
            menu_item_id=item_id,
            stock_item_id=ing.stock_item_id,
            quantity=ing.quantity,
            unit=ing.unit
        )
        db.add(new_ing)
        new_ingredients.append(new_ing)
        
    db.commit()
    for ing in new_ingredients:
        db.refresh(ing)
        
    return new_ingredients
