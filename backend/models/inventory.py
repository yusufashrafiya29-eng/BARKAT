import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from backend.db.session import Base

class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String, nullable=False) # e.g., 'kg', 'pcs'
    minimum_threshold = Column(Float, default=0.0, nullable=False)
    
    # Production additions
    cost_price = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
