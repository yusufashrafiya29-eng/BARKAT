import enum
import uuid
from sqlalchemy import Column, String, Enum as SAEnum, Boolean, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.session import Base
from sqlalchemy.orm import relationship

class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    WAITER = "WAITER"
    KITCHEN = "KITCHEN"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    # UUID is synced with Supabase Auth UUID when Supabase is configured.
    # In local dev mode, we generate our own UUID.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=False)  # Required for OTP

    role = Column(SAEnum(UserRole), default=UserRole.WAITER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Restaurant association
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=True)
    restaurant_email = Column(String, nullable=True) # For STAFF to link with OWNER

    # Relationships
    restaurant = relationship("Restaurant", back_populates="users")


    # Local password hash — only used in dev mode (when Supabase is not configured).
    # In production, Supabase Auth handles passwords; this column stays NULL.
    password_hash = Column(String, nullable=True)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
