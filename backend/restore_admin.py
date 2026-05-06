import os
from db.session import SessionLocal
from models.user import User, UserRole
from api.api_v1.auth import _hash_password as get_password_hash

def restore_superadmin():
    db = SessionLocal()
    try:
        email = "yusufashrafiya29@gmail.com"
        admin = db.query(User).filter(User.email == email).first()
        
        if not admin:
            print(f"Creating new Super Admin for {email}...")
            admin = User(
                email=email,
                full_name="Platform Admin",
                role=UserRole.SUPERADMIN,
                password_hash=get_password_hash("admin123"),
                is_active=True,
                is_verified=True,
                is_approved=True,
                phone_number="9979114665"
            )
            db.add(admin)
            db.commit()
            print("Successfully created Super Admin!")
        else:
            print(f"User {email} already exists. Setting role to SUPERADMIN and resetting password to 'admin123'...")
            admin.role = UserRole.SUPERADMIN
            admin.restaurant_id = None # Detach from any restaurant so it doesn't get deleted again
            admin.password_hash = get_password_hash("admin123")
            db.commit()
            print("Successfully restored Super Admin role and reset password!")
            
    except Exception as e:
        print(f"Error restoring superadmin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    restore_superadmin()
