import enum
import uuid
from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from db.session import Base

class MessageStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"

class MessageType(str, enum.Enum):
    ORDER_CONFIRMED = "ORDER_CONFIRMED"
    ORDER_PREPARING = "ORDER_PREPARING"
    ORDER_READY = "ORDER_READY"
    BILL_GENERATED = "BILL_GENERATED"

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    customer_phone = Column(String, nullable=False)
    message_type = Column(SAEnum(MessageType), nullable=False)
    status = Column(SAEnum(MessageStatus), default=MessageStatus.PENDING, nullable=False)
    
    # Optional Provider specific trace (Twilio/Interakt tracking ID)
    provider_response = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
