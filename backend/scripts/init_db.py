import asyncio
import os
import sys

# Ensure app is in Python path for script execution
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# ensure models imported to register in Base.metadata
from app.core.db import engine
from app.models.base import Base
import app.models.domain  # explicitly import to bind to Base metadata
import app.models.inventory  # explicitly import to bind to Base metadata


async def create_tables():
    print("Creating database tables based on declarative schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

    # The application gracefully handles connections, but we must dispose the engine
    # to close out the asyncio loop thread cleanly.
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
