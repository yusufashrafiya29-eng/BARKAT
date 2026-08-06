import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.session import Base
from sqlalchemy.orm import relationship

class SaaSPayment(Base):
    __tablename__ = "saas_payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    plan_name = Column(String, nullable=False) # basic, pro, max
    billing_cycle = Column(String, nullable=False) # monthly, yearly
    
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    
    status = Column(String, default="PENDING") # PENDING, PAID, FAILED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    restaurant = relationship("Restaurant")
