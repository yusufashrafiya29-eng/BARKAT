from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from api.deps import get_db, get_current_user_token
from schemas.billing import BillCreate, BillRead, PaymentConfirmation
from services import billing_service
from models.notification import MessageType
from services.whatsapp_service import trigger_whatsapp_message

router = APIRouter()

@router.post("/{order_id}/generate", response_model=BillRead)
def generate_order_bill(
    order_id: UUID, 
    bill_in: BillCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token) # Secure route
):
    bill = billing_service.generate_bill(db, order_id, bill_in)
    
    if bill.order.customer_phone:
        background_tasks.add_task(
            trigger_whatsapp_message, bill.order.id, bill.order.customer_phone, MessageType.BILL_GENERATED, 
            f"Your bill for {bill.total_amount} has been structurally generated!"
        )
        
    return bill

@router.put("/{order_id}/confirm", response_model=BillRead)
def apply_payment_confirmation(
    order_id: UUID, 
    confirmation: PaymentConfirmation, 
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    return billing_service.confirm_payment(db, order_id, confirmation.transaction_id)
