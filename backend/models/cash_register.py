import enum
import uuid
from sqlalchemy import Column, String, Enum as SAEnum, Float, DateTime, ForeignKey, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.session import Base


class ShiftStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class TransactionType(str, enum.Enum):
    CASH_IN = "CASH_IN"
    CASH_OUT = "CASH_OUT"


class CashShift(Base):
    __tablename__ = "cash_shifts"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    opened_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    closed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    opening_balance = Column(Float, nullable=False, default=0.0)
    closing_balance = Column(Float, nullable=True)   # physically counted at close
    expected_balance = Column(Float, nullable=True)  # calculated by system
    net_sales = Column(Float, nullable=False, default=0.0)  # auto-updated on PAID orders
    total_cash_in = Column(Float, nullable=False, default=0.0)
    total_cash_out = Column(Float, nullable=False, default=0.0)

    status = Column(SAEnum(ShiftStatus), default=ShiftStatus.OPEN, nullable=False)
    notes = Column(Text, nullable=True)

    opened_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    transactions = relationship("CashTransaction", back_populates="shift", cascade="all, delete-orphan")


class CashTransaction(Base):
    __tablename__ = "cash_transactions"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("cash_shifts.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    type = Column(SAEnum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    shift = relationship("CashShift", back_populates="transactions")
