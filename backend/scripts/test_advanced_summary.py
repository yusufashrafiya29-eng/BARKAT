import sys
import os
import random
from uuid import uuid4
from datetime import datetime

# Setup paths to import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.session import SessionLocal
from models.order import Order, OrderStatus
from models.restaurant import Restaurant

def run():
    db = SessionLocal()
    restaurant = db.query(Restaurant).first()
    if not restaurant:
        print("No restaurant found to attach test orders to.")
        return

    # Create 5 test orders with varying new fields
    localities = ["Bandra West", "Andheri East", "Juhu", "Bandra West", "Colaba"]
    guests = [2, 4, 6, 2, 10]
    counters = ["Ground Floor POS", "1st Floor Kiosk", "Main Register", "Main Register", "Ground Floor POS"]
    tips = [50.0, 0.0, 150.0, 20.0, 500.0]

    for i in range(5):
        new_order = Order(
            id=uuid4(),
            restaurant_id=restaurant.id,
            order_type="DINE_IN" if i % 2 == 0 else "DELIVERY",
            status=OrderStatus.SERVED,
            customer_name=f"Test User {i}",
            customer_address=localities[i],
            guests_count=guests[i],
            counter_name=counters[i],
            tip_amount=tips[i],
            total_amount=random.uniform(500, 3000),
            subtotal_amount=random.uniform(400, 2500),
            tax_amount=random.uniform(50, 300),
            payment_status="PAID"
        )
        db.add(new_order)
    
    db.commit()
    print("Successfully generated 5 dummy orders for advanced reporting!")

if __name__ == "__main__":
    run()
