from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from uuid import UUID

class ModifierBase(BaseModel):
    name: str = Field(..., min_length=1)
    price: float = Field(default=0.0, ge=0.0)
    is_available: bool = True

class ModifierCreate(ModifierBase):
    pass

class ModifierRead(ModifierBase):
    id: UUID
    group_id: UUID
    class Config:
        from_attributes = True

class ModifierGroupBase(BaseModel):
    name: str = Field(..., min_length=1)
    is_required: bool = False
    min_selections: int = Field(default=0, ge=0)
    max_selections: int = Field(default=1, ge=1)
    price_replaces_base: bool = False

class ModifierGroupCreate(ModifierGroupBase):
    modifiers: List[ModifierCreate] = []

class ModifierGroupRead(ModifierGroupBase):
    id: UUID
    menu_item_id: UUID
    modifiers: List[ModifierRead] = []
    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: float = Field(..., ge=0.0)
    is_veg: bool = False
    is_available: bool = True
    preparation_time: Optional[int] = None
    image_url: Optional[str] = None
    tax_rate: float = 5.0
    model_3d_url: Optional[str] = None
    model_3d_task_id: Optional[str] = None
    model_3d_height: float = 12.0
    model_3d_active: bool = True
    image_url_extra1: Optional[str] = None
    image_url_extra2: Optional[str] = None


class MenuItemCreate(MenuItemBase):
    category_id: UUID

class RecipeIngredientBase(BaseModel):
    stock_item_id: UUID
    quantity: float = Field(..., gt=0.0)
    unit: str = Field(..., min_length=1)

class RecipeIngredientCreate(RecipeIngredientBase):
    pass

class RecipeIngredientRead(RecipeIngredientBase):
    id: UUID
    menu_item_id: UUID

    class Config:
        from_attributes = True

class MenuItemRead(MenuItemBase):
    id: UUID
    category_id: UUID
    recipe_ingredients: List[RecipeIngredientRead] = []
    modifier_groups: List[ModifierGroupRead] = []

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
    tax_rate: Optional[float] = None
    model_3d_url: Optional[str] = None
    model_3d_task_id: Optional[str] = None
    model_3d_height: Optional[float] = None
    model_3d_active: Optional[bool] = None
    image_url_extra1: Optional[str] = None
    image_url_extra2: Optional[str] = None
    modifier_groups: Optional[List[ModifierGroupCreate]] = None

class Model3DGenerateRequest(BaseModel):
    ai_model: str = "meshy-6"
    enable_pbr: bool = True
    texture_resolution: str = "2k"



class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    is_active: bool = True
    station: str = "Kitchen"

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: UUID
    menu_items: List[MenuItemRead] = []

    class Config:
        from_attributes = True
