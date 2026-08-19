import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.session import Base

class AggregatorItemMapping(Base):
    __tablename__ = "aggregator_item_mappings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    
    # Internal ID
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    
    # Platform Info
    platform = Column(String, nullable=False) # 'Zomato', 'Swiggy'
    platform_item_id = Column(String, nullable=False, index=True)
    platform_item_name = Column(String, nullable=True) # For reference in UI
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    menu_item = relationship("MenuItem")
