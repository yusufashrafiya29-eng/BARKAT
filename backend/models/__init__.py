# Ensure metadata creates all tables by importing them together
from .user import User, UserRole
from .table import Table
from .menu import Category, MenuItem
from .order import Order, OrderItem, OrderStatus
from .billing import Bill
from .inventory import StockItem
from .notification import NotificationLog
from .otp import OTP
from .settings import RestaurantConfig
from .restaurant import Restaurant
