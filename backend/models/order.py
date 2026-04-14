import enum
import uuid
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Enum as SAEnum, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.db.session import Base

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    SERVED = "SERVED"
    CANCELLED = "CANCELLED"

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), ForeignKey("tables.id"), nullable=False)
    
    # Waiter tracking
    waiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    customer_phone = Column(String, nullable=True) # Used for WhatsApp
    
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    
    # New fields for Customer vs Waiter ordering
    source = Column(String, default="WAITER", nullable=False)
    is_accepted = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    waiter = relationship("User")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False, default=1)
    price_at_order_time = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False) # Extracted via Service logic
    notes = Column(String, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")
