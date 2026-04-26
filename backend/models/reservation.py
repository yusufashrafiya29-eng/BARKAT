import uuid
from sqlalchemy import Column, String, Integer, Float, Date, Time, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.session import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    table_id = Column(UUID(as_uuid=True), ForeignKey("tables.id"), nullable=True) # Assigned later or during manual booking
    
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    reservation_date = Column(Date, nullable=False)
    reservation_time = Column(Time, nullable=False)
    guest_count = Column(Integer, nullable=False)
    
    # PENDING (for public booking before approval/payment), CONFIRMED, CANCELLED, COMPLETED
    status = Column(String, nullable=False, default="CONFIRMED") 
    
    # NONE, PENDING, PAID, REFUNDED
    payment_status = Column(String, nullable=False, default="NONE")
    advance_amount = Column(Float, nullable=False, default=0.0)
    
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    restaurant = relationship("Restaurant")
    table = relationship("Table")
