import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.session import engine, Base
from models.aggregator import AggregatorOrder

def alter_db():
    print("Creating aggregator_orders table...")
    
    # Create the table if it doesn't exist
    AggregatorOrder.__table__.create(bind=engine, checkfirst=True)
    
    print("Table created successfully!")

if __name__ == "__main__":
    alter_db()
