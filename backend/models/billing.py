import enum
import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Enum as SAEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.session import Base

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_id = Column(UUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False) # 'CASH', 'UPI', 'CARD', 'TAB'
    transaction_reference = Column(String, nullable=True)
    status = Column(String, default="COMPLETED", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    bill = relationship("Bill", back_populates="transactions")

class Bill(Base):
    __tablename__ = "bills"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    payment_method = Column(SAEnum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    amount_paid = Column(Float, nullable=False, default=0.0)
    transaction_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    order = relationship("Order")
    transactions = relationship("PaymentTransaction", back_populates="bill", cascade="all, delete-orphan")
