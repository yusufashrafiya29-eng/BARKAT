import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, func, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from db.session import Base

class ExpenseVoucher(Base):
    __tablename__ = "expense_vouchers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    voucher_id = Column(String, nullable=False) # e.g. EXP-101
    payee = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, default=0.0, nullable=False)
    payment_mode = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    remarks = Column(Text, default="")
    verified_by = Column(String, default="Owner Portal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    code = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False) # PERCENTAGE or FIXED
    value = Column(Float, nullable=False)
    min_order = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
    expiry = Column(String, default="2026-12-31")
    usage_count = Column(Integer, default=0)

class HappyHour(Base):
    __tablename__ = "happy_hours"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    days = Column(String, default="Mon,Tue,Wed,Thu,Fri,Sat,Sun") # Comma separated or JSON string
    start_time = Column(String, default="15:00")
    end_time = Column(String, default="18:00")
    discount_percent = Column(Float, default=20.0)
    category = Column(String, default="Beverages")
    active = Column(Boolean, default=True)

class BogoRule(Base):
    __tablename__ = "bogo_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    buy_item = Column(String, nullable=False)
    buy_qty = Column(Integer, default=1)
    get_item = Column(String, nullable=False)
    get_qty = Column(Integer, default=1)
    active = Column(Boolean, default=True)

class BranchOutlet(Base):
    __tablename__ = "branch_outlets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    branch_code = Column(String, nullable=False) # e.g. BR-1
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    manager = Column(String, default="Assigned Manager")
    status = Column(String, default="Online (Connected)")
    today_sales = Column(String, default="₹0")
    health_score = Column(String, default="100%")

class CentralStockItem(Base):
    __tablename__ = "central_stock_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    item_code = Column(String, nullable=False) # e.g. STK-101
    name = Column(String, nullable=False)
    total_batch = Column(Float, default=0.0)
    unit = Column(String, nullable=False)
    batch_date = Column(String, nullable=False)
    expiry = Column(String, nullable=False)
    temperature = Column(String, default="4°C Chilled")
    qc_status = Column(String, default="Passed (Chef Approved 🟢)")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    transfer_code = Column(String, nullable=False) # e.g. TR-9001
    voucher_number = Column(String, nullable=False) # e.g. WTV-2026-8801
    source_kitchen = Column(String, default="Central Commissary (Base Kitchen HQ)")
    destination_branch = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    quantity = Column(Float, default=0.0)
    unit = Column(String, nullable=False)
    dispatched_at = Column(String, nullable=False)
    status = Column(String, default="IN_TRANSIT")
    driver_name = Column(String, nullable=False)

class AggregatorOrder(Base):
    __tablename__ = "aggregator_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    order_id = Column(String, nullable=False, index=True) # e.g. ZOM-84921
    platform = Column(String, nullable=False) # Zomato, Swiggy, ONDC Food, Direct Web
    customer_name = Column(String, nullable=False)
    items_summary = Column(Text, nullable=False)
    gross_amount = Column(Float, default=0.0)
    platform_commission_rate = Column(Float, default=0.0)
    ad_deduction = Column(Float, default=0.0)
    gst_on_commission = Column(Float, default=0.0)
    net_payout = Column(Float, default=0.0)
    rider_name = Column(String, default="Unassigned")
    rider_status = Column(String, default="ASSIGNED_WAITING")
    eta = Column(String, default="Arriving soon")
    status = Column(String, default="NEW")
    ordered_at = Column(String, default="Just Now")
