import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, func, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.session import Base

class AggregatorOrder(Base):
    __tablename__ = "aggregator_orders"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    
    # External IDs
    platform_order_id = Column(String, nullable=True, index=True) # Zomato/Swiggy ID
    
    # Platform Info
    platform = Column(String, nullable=False) # 'Zomato', 'Swiggy', 'ONDC Food', 'Direct Web'
    
    # Customer Info
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    
    # Order Details
    items_summary = Column(String, nullable=True) # Text summary for quick UI view
    raw_payload = Column(JSON, nullable=True) # Store full JSON for debugging/syncing
    
    # Financials
    gross_amount = Column(Float, default=0.0, nullable=False)
    platform_commission_rate = Column(Float, default=0.0, nullable=False) # e.g. 22 for 22%
    ad_deduction = Column(Float, default=0.0, nullable=False)
    gst_on_commission = Column(Float, default=0.0, nullable=False)
    net_payout = Column(Float, default=0.0, nullable=False)
    
    # Status tracking
    status = Column(String, default="NEW", nullable=False) # NEW, KITCHEN_PREPARING, READY_FOR_RIDER
    
    # Rider Info
    rider_name = Column(String, nullable=True)
    rider_phone = Column(String, nullable=True)
    rider_status = Column(String, default="ASSIGNED_WAITING", nullable=False)
    eta = Column(String, nullable=True)
    
    # Timestamps
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    restaurant = relationship("Restaurant")
