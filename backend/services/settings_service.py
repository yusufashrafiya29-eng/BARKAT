from sqlalchemy.orm import Session
from models.settings import RestaurantConfig

def get_config_value(db: Session, key: str, restaurant_id: str) -> str | None:
    config = db.query(RestaurantConfig).filter(RestaurantConfig.key == key, RestaurantConfig.restaurant_id == restaurant_id).first()
    if config:
        return config.value
    return None

def set_config_value(db: Session, key: str, value: str, restaurant_id: str) -> RestaurantConfig:
    config = db.query(RestaurantConfig).filter(RestaurantConfig.key == key, RestaurantConfig.restaurant_id == restaurant_id).first()
    if config:
        config.value = value
    else:
        config = RestaurantConfig(key=key, value=value, restaurant_id=restaurant_id)
        db.add(config)
    db.commit()
    db.refresh(config)
    return config
