import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient

from backend.app.config import settings

logger = logging.getLogger("uvicorn.error")


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None


db_instance = Database()


async def connect_to_mongo():
    """Connect to the configured MongoDB database."""
    try:
        logger.info(
            f"Connecting to MongoDB at {settings.MONGODB_URL}..."
        )

        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )

        # Verify that MongoDB is actually reachable.
        await db_instance.client.admin.command("ping")

        db_instance.db = db_instance.client[
            settings.DATABASE_NAME
        ]

        logger.info(
            f"MongoDB connection successful: "
            f"{settings.DATABASE_NAME}"
        )

    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")

        db_instance.client = None
        db_instance.db = None

        raise


async def close_mongo_connection():
    """Close MongoDB connection gracefully."""

    if db_instance.client:
        db_instance.client.close()

        db_instance.client = None
        db_instance.db = None

        logger.info("MongoDB connection closed.")


def get_database():
    """Return the active MongoDB database instance."""
    return db_instance.db