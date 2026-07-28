import sys
from sqlalchemy.orm import Session
from db.session import SessionLocal
from models.user import User
from models.order import Order
from models.reservation import Reservation

from models.billing import Bill

def clear_data(email: str):
    db: Session = SessionLocal()
    try:
        owner = db.query(User).filter(User.email == email, User.role == 'OWNER').first()
        if not owner:
            print(f"Error: Owner with email {email} not found.")
            return

        rest_id = owner.restaurant_id
        
        # Delete bills first since they reference orders
        bills = db.query(Bill).filter(Bill.restaurant_id == rest_id).all()
        for b in bills:
            db.delete(b)
        
        orders = db.query(Order).filter(Order.restaurant_id == rest_id).all()
        for o in orders:
            db.delete(o)
            
        db.commit()
        print(f"Deleted {len(bills)} bills and {len(orders)} orders for {email}.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    if email:
        clear_data(email)
    else:
        print("Usage: python clear_data.py <owner_email>")
