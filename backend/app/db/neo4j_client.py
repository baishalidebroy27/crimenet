from neo4j import GraphDatabase
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self._driver = None

    def connect(self):
        try:
            self._driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            # Verify connection
            self._driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
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
