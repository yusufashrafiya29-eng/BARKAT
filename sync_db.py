from backend.db.session import engine, Base
from backend.models.settings import RestaurantConfig

# Create all missing tables in the metadata
Base.metadata.create_all(bind=engine)
print("Finished migrating database for RestaurantConfig.")
