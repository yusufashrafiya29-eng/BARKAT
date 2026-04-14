# Ensure metadata creates all tables by importing them together
from backend.models.user import User
from backend.models.menu import Category, MenuItem
from backend.models.table import Table
from backend.models.order import Order, OrderItem
from backend.models.inventory import StockItem
from backend.models.billing import Bill
from backend.models.notification import NotificationLog
from backend.models.otp import OTP
