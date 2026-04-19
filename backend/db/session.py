from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Supabase (and many cloud providers) give a postgres:// URL.
# SQLAlchemy 1.4+ requires postgresql:// — fix it silently.
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    pool_pre_ping=True,          # Verify connections before use
    pool_recycle=300,             # Recycle connections every 5 min (Supabase pooler)
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
