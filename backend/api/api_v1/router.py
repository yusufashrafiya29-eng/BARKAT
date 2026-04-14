from fastapi import APIRouter
from api.api_v1 import health, auth, menu, orders, tables, inventory, billing, users, analytics, settings

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Restaurant functional routes
api_router.include_router(menu.router, prefix="/menu", tags=["Menu"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(tables.router, prefix="/tables", tags=["Tables"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
