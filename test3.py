from backend.db.session import SessionLocal
from backend.services.menu_service import get_all_active_categories
from backend.models.menu import MenuItem
from backend.schemas.menu import CategoryRead

db = SessionLocal()
try:
    categories = get_all_active_categories(db)
    print("CATEGORIES:", [cat.name for cat in categories])
    for cat in categories:
        print(f"Cat {cat.name} items:", len(cat.menu_items))
        for item in cat.menu_items:
            print(f"- {item.name}: {item.price}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
