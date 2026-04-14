from sqlalchemy import Column, String
from backend.db.session import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class RestaurantConfig(Base):
    __tablename__ = "restaurant_config"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
