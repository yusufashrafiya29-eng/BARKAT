import sys
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.session import SessionLocal
from models.restaurant import Restaurant

def activate(restaurant_email: str, months: int = 1):
    db: Session = SessionLocal()
    try:
        from models.user import User
        owner = db.query(User).filter(User.email == restaurant_email, User.role == 'OWNER').first()
        if not owner:
            print(f"Error: Owner with email {restaurant_email} not found.")
            return

        restaurant = db.query(Restaurant).filter(Restaurant.id == owner.restaurant_id).first()
        if not restaurant:
            print(f"Error: Restaurant not found for owner {restaurant_email}.")
            return

        restaurant.subscription_status = "active"
        if restaurant.subscription_ends_at and restaurant.subscription_ends_at > datetime.utcnow():
            # Extend existing
            restaurant.subscription_ends_at = restaurant.subscription_ends_at + timedelta(days=30 * months)
        else:
            # Start new
            restaurant.subscription_ends_at = datetime.utcnow() + timedelta(days=30 * months)
            
        db.commit()
        print(f"✅ Successfully activated subscription for {restaurant.name} ({restaurant_email}) for {months} months.")
        print(f"Subscription ends at: {restaurant.subscription_ends_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python activate_subscription.py <owner_email> [months]")
        sys.exit(1)
        
    email = sys.argv[1]
    months = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    activate(email, months)
