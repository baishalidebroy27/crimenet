import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings
import pymongo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def setup_mongodb():
    logger.info("Setting up MongoDB collections and indexes...")
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db]
    
    # Uploads collection
    await db.uploads.create_index("upload_id", unique=True)
    await db.uploads.create_index("file_type")
    await db.uploads.create_index([("uploaded_at", pymongo.DESCENDING)])
    await db.uploads.create_index("status")
    
    # Entities collection
    await db.entities.create_index("entity_id", unique=True)
    await db.entities.create_index("type")
    await db.entities.create_index([("name", pymongo.TEXT)])
    await db.entities.create_index("normalized_name")
    await db.entities.create_index("resolution_status")
    
    # Relationships collection
    await db.relationships.create_index("source_entity_id")
    await db.relationships.create_index("target_entity_id")
    await db.relationships.create_index("type")
    await db.relationships.create_index("source_upload_id")
    
    # Processing logs collection
    await db.processing_logs.create_index("task_id", unique=True)
    await db.processing_logs.create_index("upload_id")
    await db.processing_logs.create_index("pipeline")
    await db.processing_logs.create_index("status")
    
    # Risk scores collection
    await db.risk_scores.create_index("entity_id", unique=True)
    await db.risk_scores.create_index("risk_level")
    await db.risk_scores.create_index([("risk_score", pymongo.DESCENDING)])
    
    # Anomalies collection
    await db.anomalies.create_index("entity_id")
    await db.anomalies.create_index("type")
    await db.anomalies.create_index("severity")
    await db.anomalies.create_index("status")
    
    client.close()
    logger.info("MongoDB setup complete.")

if __name__ == "__main__":
    asyncio.run(setup_mongodb())
