import asyncio
from sqlalchemy import text
from db.session import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE restaurants ADD COLUMN subscription_plan VARCHAR DEFAULT 'basic';"))
            print("Successfully added subscription_plan column to restaurants table.")
        except Exception as e:
            print(f"Error adding subscription_plan (maybe it already exists?): {e}")

if __name__ == "__main__":
    asyncio.run(main())
