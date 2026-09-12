from neo4j import GraphDatabase
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self._driver = None

    def connect(self, retries=5, delay=5):
        import time
        for attempt in range(retries):
            try:
                uri = settings.neo4j_uri
                if uri.startswith("neo4j+s://"):
                    # Use neo4j+ssc to bypass strict SSL verification which fails on some Render environments
                    uri = uri.replace("neo4j+s://", "neo4j+ssc://")
                    
                self._driver = GraphDatabase.driver(
                    uri,
                    auth=(settings.neo4j_user, settings.neo4j_password)
                )
                # Verify connection
                self._driver.verify_connectivity()
                logger.info("Connected to Neo4j successfully")
                return
            except Exception as e:
                logger.warning(f"Failed to connect to Neo4j (Attempt {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    time.sleep(delay)
                else:
                    logger.error("All attempts to connect to Neo4j failed.")
                    raise

    def close(self):
        if self._driver is not None:
            self._driver.close()
            logger.info("Neo4j connection closed")
            
    def get_driver(self):
        if self._driver is None:
            self.connect()
        return self._driver

neo4j_client = Neo4jClient()
