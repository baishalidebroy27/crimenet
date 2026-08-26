import redis.asyncio as redis
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self.redis = None

    async def connect(self):
        try:
            self.redis = redis.from_url(settings.redis_url, decode_responses=True)
            # Verify connection
            await self.redis.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def close(self):
        if self.redis:
            await self.redis.aclose()
            logger.info("Redis connection closed")

redis_client = RedisClient()
