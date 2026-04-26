from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import date

from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.reservation import ReservationCreateManual, ReservationCreatePublic, ReservationStatusUpdate, ReservationRead
from models.reservation import Reservation
from models.restaurant import Restaurant
from models.notification import MessageType
from services.whatsapp_service import trigger_whatsapp_message
import razorpay
from core.config import settings

router = APIRouter()

# Initialize Razorpay client
def get_razorpay_client(key_id, key_secret):
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))

@router.get("/", response_model=List[ReservationRead])
def get_reservations(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Get all reservations for the owner dashboard"""
    return db.query(Reservation).filter(Reservation.restaurant_id == restaurant_id).order_by(Reservation.reservation_date.desc(), Reservation.reservation_time.desc()).limit(100).all()

@router.post("/manual", response_model=ReservationRead)
def create_manual_reservation(
    reservation_in: ReservationCreateManual,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Staff creates a manual reservation (already confirmed, no advance needed)"""
    new_res = Reservation(
        **reservation_in.model_dump(),
        restaurant_id=restaurant_id,
        status="CONFIRMED"
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    
    # Notify customer
    background_tasks.add_task(
        trigger_whatsapp_message, new_res.id, new_res.customer_phone, MessageType.ORDER_CONFIRMED, 
        f"Your table reservation for {new_res.guest_count} guests on {new_res.reservation_date} at {new_res.reservation_time} is confirmed."
    )
    
    return new_res

@router.get("/public/restaurant/{restaurant_id}")
def get_public_restaurant_info(restaurant_id: UUID, db: Session = Depends(get_db)):
    """Fetch public restaurant branding info for the booking page"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return {
        "id": str(restaurant.id),
        "name": restaurant.name,
        "logo_url": restaurant.logo_url,
        "advance_booking_fee": restaurant.advance_booking_fee
    }

@router.post("/public/{restaurant_id}", response_model=ReservationRead)
def create_public_reservation(
    restaurant_id: UUID,
    reservation_in: ReservationCreatePublic,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Public customer requests a reservation"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    fee = restaurant.advance_booking_fee or 0.0
    
    new_res = Reservation(
        **reservation_in.model_dump(),
        restaurant_id=restaurant_id,
        status="PENDING", # Pending until they pay or manager confirms
        advance_amount=fee
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    
    return new_res

@router.post("/{res_id}/pay")
def init_razorpay_payment(res_id: UUID, db: Session = Depends(get_db)):
    """Initialize Razorpay order for advance payment"""
    res = db.query(Reservation).filter(Reservation.id == res_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    from services.settings_service import get_config_value
    key_id = get_config_value(db, "razorpay_key_id", str(res.restaurant_id))
    key_secret = get_config_value(db, "razorpay_key_secret", str(res.restaurant_id))
    
    if not key_id or not key_secret:
        # Cannot pay via razorpay, just accept it
        res.status = "CONFIRMED"
        db.commit()
        return {"message": "Restaurant has no online payments. Booking confirmed automatically."}
        
    client = get_razorpay_client(key_id, key_secret)
    if not client:
        raise HTTPException(status_code=500, detail="Invalid payment keys")
        
    amount_paise = int(res.advance_amount * 100)
    
    try:
        data = {"amount": amount_paise, "currency": "INR", "receipt": str(res.id)}
        payment = client.order.create(data=data)
        
        res.razorpay_order_id = payment['id']
        db.commit()
        
        return {
            "razorpay_order_id": payment['id'],
            "razorpay_key_id": key_id,
            "amount": amount_paise,
            "currency": "INR"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")

@router.post("/{res_id}/verify-payment")
def verify_payment(
    res_id: UUID,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    res = db.query(Reservation).filter(Reservation.id == res_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    from services.settings_service import get_config_value
    key_id = get_config_value(db, "razorpay_key_id", str(res.restaurant_id))
    key_secret = get_config_value(db, "razorpay_key_secret", str(res.restaurant_id))
    
    client = get_razorpay_client(key_id, key_secret)
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        res.status = "CONFIRMED"
        res.payment_status = "PAID"
        res.razorpay_payment_id = razorpay_payment_id
        db.commit()
        
        background_tasks.add_task(
            trigger_whatsapp_message, res.id, res.customer_phone, MessageType.ORDER_CONFIRMED, 
            f"Your table reservation for {res.guest_count} guests on {res.reservation_date} at {res.reservation_time} is CONFIRMED with ₹{res.advance_amount} advance paid."
        )
        return {"message": "Payment successful"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Signature")

@router.put("/{res_id}/status", response_model=ReservationRead)
def update_status(
    res_id: UUID,
    status_update: ReservationStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    res = db.query(Reservation).filter(Reservation.id == res_id, Reservation.restaurant_id == restaurant_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    res.status = status_update.status
    if status_update.table_id:
        res.table_id = status_update.table_id
        
    db.commit()
    db.refresh(res)
    
    if res.status == "CONFIRMED":
        background_tasks.add_task(
            trigger_whatsapp_message, res.id, res.customer_phone, MessageType.ORDER_CONFIRMED, 
            f"Your table reservation is now CONFIRMED by the restaurant."
        )
        
    return res
