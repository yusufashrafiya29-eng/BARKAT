import uuid
from sqlalchemy import Column, String, DateTime, func, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from db.session import Base
from sqlalchemy.orm import relationship

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    
    # Tax & Compliance fields
    gstin = Column(String, nullable=True)
    fssai = Column(String, nullable=True)
    advance_booking_fee = Column(Float, nullable=False, default=0.0)
    
    # Platform Approval
    is_approved = Column(Boolean, default=False, nullable=False)
    
    # Subscription fields
    subscription_status = Column(String, default="trial") # "trial", "active", "expired"
    subscription_plan = Column(String, default="basic") # "basic", "pro", "max"
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    subscription_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    users = relationship("User", back_populates="restaurant")
