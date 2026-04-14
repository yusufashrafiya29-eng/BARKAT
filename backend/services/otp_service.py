import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.otp import OTP
from models.user import User


class OTPService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a numeric OTP code."""
        return "".join(random.choices(string.digits, k=length))

    @staticmethod
    def create_otp(db: Session, email: str) -> str:
        """Generate, save and return a new OTP."""
        # Deactivate previous OTPs for this email
        db.query(OTP).filter(OTP.email == email, OTP.is_used == False).update({"is_used": True})
        
        otp_code = OTPService.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        new_otp = OTP(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at
        )
        db.add(new_otp)
        db.commit()
        
        # MOCK SENDING (User approved print/log for now)
        print(f"\n[OTP SERVICE] Sending OTP {otp_code} to {email}\n")
        
        return otp_code

    @staticmethod
    def verify_otp(db: Session, email: str, otp_code: str) -> bool:
        """Verify OTP code and mark as used."""
        otp_record = db.query(OTP).filter(
            OTP.email == email,
            OTP.otp_code == otp_code,
            OTP.is_used == False,
            OTP.expires_at > datetime.utcnow()
        ).first()
        
        if not otp_record:
            return False
            
        # Mark OTP as used
        otp_record.is_used = True
        
        # Mark user as verified
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.is_verified = True
            
        db.commit()
        return True
