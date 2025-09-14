"""Database connection management with singleton pattern."""

from supabase import create_client, Client
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    """Singleton database connection manager."""

    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """
        Get or create singleton Supabase client.

        Returns:
            Supabase client instance

        Raises:
            Exception if client cannot be initialized
        """
        if cls._client is None:
            try:
                cls._client = create_client(
                    settings.supabase_url,
                    settings.supabase_key
                )
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise
        return cls._client

    @classmethod
    def health_check(cls) -> bool:
        """
        Check if database is accessible.

        Returns:
            True if database is healthy, False otherwise
        """
        try:
            client = cls.get_client()
            # Simple query to verify connection
            client.table("artifacts").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

    @classmethod
    def reset(cls):
        """Reset the client connection (useful for testing or reconnection)."""
        cls._client = None
        logger.info("Database client reset")


# Export for easy access
db = Database.get_client