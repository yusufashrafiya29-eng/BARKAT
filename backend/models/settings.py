from sqlalchemy import Column, String, ForeignKey
from db.session import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class RestaurantConfig(Base):
    __tablename__ = "restaurant_config"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    key = Column(String, index=True, nullable=False)
    value = Column(String, nullable=False)
