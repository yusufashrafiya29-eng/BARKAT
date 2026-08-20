# Ensure metadata creates all tables by importing them together
from .user import User, UserRole
from .table import Table
from .menu import Category, MenuItem
from .order import Order, OrderItem, OrderStatus
from .billing import Bill, PaymentTransaction
from .inventory import StockItem
from .notification import NotificationLog
from .otp import OTP
from .settings import RestaurantConfig
from .restaurant import Restaurant
from .cash_register import CashShift, CashTransaction
from .announcement import Announcement
from .ticket import Ticket
from .enterprise import (
    ExpenseVoucher, Coupon, HappyHour, BogoRule,
    BranchOutlet, CentralStockItem, StockTransfer
)
from .aggregator import AggregatorOrder
from .aggregator_item_map import AggregatorItemMapping
from .customer import Customer
from .reservation import Reservation
