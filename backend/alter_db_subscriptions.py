import os
from sqlalchemy import create_engine, text
from core.config import settings

def alter_db():
    print("Connecting to DB:", settings.DATABASE_URL)
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Adding subscription columns to restaurants table...")
        
        conn.execute(text("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR DEFAULT 'trial';"))
        conn.execute(text("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;"))
        conn.execute(text("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;"))
        
        # For existing restaurants, set trial_ends_at to 7 days from now so they don't get instantly locked out
        conn.execute(text("UPDATE restaurants SET trial_ends_at = NOW() + INTERVAL '7 days' WHERE trial_ends_at IS NULL;"))
        
        conn.commit()
        print("Successfully added subscription columns.")

if __name__ == "__main__":
    alter_db()
