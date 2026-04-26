import uuid
from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.schema import UniqueConstraint
from db.session import Base

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint('restaurant_id', 'name', name='uq_category_name_per_restaurant'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    station = Column(String, default="Kitchen") # Routing for KDS

    # Relationships
    menu_items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False)
    stock_item_id = Column(UUID(as_uuid=True), ForeignKey("stock_items.id"), nullable=False)
    quantity = Column(Float, nullable=False) # e.g. 150.0
    unit = Column(String, nullable=False) # e.g. 'g' or 'ml' or 'pcs'

    menu_item = relationship("MenuItem", back_populates="recipe_ingredients")
    stock_item = relationship("StockItem")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    
    # Tax & Compliance
    tax_rate = Column(Float, default=5.0) # Standard 5% GST for food
    
    # Required Improvements
    is_veg = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    preparation_time = Column(Integer, nullable=True) # minutes
    image_url = Column(String, nullable=True)

    # Aggregator Mapping
    external_id = Column(String, nullable=True) # ID from UrbanPiper/Zomato/Swiggy

    # Relationships
    category = relationship("Category", back_populates="menu_items")
    recipe_ingredients = relationship("RecipeIngredient", back_populates="menu_item", cascade="all, delete-orphan")
