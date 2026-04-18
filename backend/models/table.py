import uuid
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
from db.session import Base

class Table(Base):
    __tablename__ = "tables"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    table_number = Column(Integer, unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False, default=4)
    qr_code_url = Column(String, nullable=True)
    last_order_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    orders = relationship("Order", back_populates="table")
