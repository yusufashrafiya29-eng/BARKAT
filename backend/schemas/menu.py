from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    is_veg: bool = False
    is_available: bool = True
    preparation_time: Optional[int] = None
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    category_id: UUID

class MenuItemRead(MenuItemBase):
    id: UUID
    category_id: UUID

    class Config:
        from_attributes = True

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None
    image_url: Optional[str] = None

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: UUID
    menu_items: List[MenuItemRead] = []

    class Config:
        from_attributes = True
