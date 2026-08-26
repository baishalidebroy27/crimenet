import asyncio
import logging
from neo4j import AsyncGraphDatabase
import os
import sys

# Add parent dir to path to import app config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def setup_neo4j():
    logger.info("Setting up Neo4j constraints and indexes...")
    driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password)
    )
    
    queries = [
        "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
        "CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)",
        "CREATE INDEX person_phone IF NOT EXISTS FOR (p:Person) ON (p.phone)",
        "CREATE INDEX person_risk IF NOT EXISTS FOR (p:Person) ON (p.risk_score)",
        "CREATE FULLTEXT INDEX person_search IF NOT EXISTS FOR (n:Person) ON EACH [n.name, n.phone, n.email]",
        
        "CREATE INDEX location_name IF NOT EXISTS FOR (l:Location) ON (l.name)",
        "CREATE INDEX phone_number IF NOT EXISTS FOR (ph:Phone) ON (ph.number)",
        "CREATE INDEX vehicle_reg IF NOT EXISTS FOR (v:Vehicle) ON (v.registration)"
    ]
    
    async with driver.session() as session:
        for query in queries:
            try:
                await session.run(query)
                logger.info(f"Executed: {query}")
            except Exception as e:
                logger.warning(f"Error executing {query}: {e}")
                
    await driver.close()
    logger.info("Neo4j setup complete.")

if __name__ == "__main__":
    asyncio.run(setup_neo4j())
