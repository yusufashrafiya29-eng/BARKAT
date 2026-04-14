# Ensure metadata creates all tables by importing them together
from models.user import User
from models.menu import Category, MenuItem
from models.table import Table
from models.order import Order, OrderItem
from models.inventory import StockItem
from models.billing import Bill
from models.notification import NotificationLog
from models.otp import OTP
