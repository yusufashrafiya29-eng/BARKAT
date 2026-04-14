import logging
import requests
from uuid import UUID
from db.session import SessionLocal
from models.notification import NotificationLog, MessageStatus, MessageType
from core.config import settings

logger = logging.getLogger(__name__)

# Basic abstraction so we can switch providers later (Twilio, Meta, Interakt)
class WhatsAppProviderConfig:
    URL = settings.WHATSAPP_API_URL
    HEADERS = {"Authorization": f"Bearer {settings.WHATSAPP_API_KEY}"} if settings.WHATSAPP_API_KEY else {}

def trigger_whatsapp_message(order_id: UUID, phone: str, message_type: MessageType, payload: str):
    """
    Called strictly by FastAPI BackgroundTasks.
    Handles the database tracking, logging, and REST execution via a distinct thread-safe session.
    """
    if not phone:
        logger.info(f"Skipping WhatsApp for Order {order_id} - No phone number provided.")
        return
        
    db = SessionLocal()
    try:
        log_entry = NotificationLog(
            order_id=order_id,
            customer_phone=phone,
            message_type=message_type,
            status=MessageStatus.PENDING
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        logger.info(f"Sending {message_type.value} to {phone}")
        
        if not WhatsAppProviderConfig.URL:
            logger.info(f"[MOCK WHATSAPP] To: {phone} | MSG: {payload}")
            log_entry.status = MessageStatus.SENT
            log_entry.provider_response = "Mocked Console Delivery (No API URL Setup)"
        else:
            max_retries = 3
            success = False
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        WhatsAppProviderConfig.URL, 
                        json={"to": phone, "message": payload},
                        headers=WhatsAppProviderConfig.HEADERS,
                        timeout=5
                    )
                    response.raise_for_status()
                    log_entry.provider_response = str(response.status_code)
                    success = True
                    break
                except requests.RequestException as e:
                    logger.warning(f"WhatsApp Attempt {attempt+1} failed: {str(e)}")
                    log_entry.provider_response = str(e)
            
            log_entry.status = MessageStatus.SENT if success else MessageStatus.FAILED
            
        db.commit()
    except Exception as e:
        logger.error(f"WhatsApp Fatal Error: {str(e)}")
    finally:
        db.close()
