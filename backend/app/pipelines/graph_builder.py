import logging
from app.db.neo4j_client import neo4j_client
from app.db.mongodb_client import mongodb_client

logger = logging.getLogger(__name__)

class GraphBuilder:
    def __init__(self):
        self.driver = neo4j_client.get_driver()

    async def build(self):
        logger.info("Starting Graph Build process")
        if self.driver is None or mongodb_client.db is None:
            return
            
        # Get resolved entities
        cursor = mongodb_client.db.entities.find({"resolution_status": "resolved"})
        entities = await cursor.to_list(length=1000)
        with self.driver.session() as session:
            for entity in entities:
                entity_type = entity.get("type", "ENTITY").upper()
                
                # Assign dynamic risk score for visualization
                risk_score = 0
                if entity_type == "PERSON":
                    risk_score = 85
                elif entity_type == "PHONE":
                    risk_score = 65
                else:
                    risk_score = 25
                    
                query = f"""
                MERGE (n:{entity_type} {{id: $id}})
                SET n.name = $name,
                    n.type = '{entity_type}',
                    n.risk_score = {risk_score},
                    n.normalized_name = $normalized_name,
                    n.sources = $sources,
                    n.dob = coalesce($dob, n.dob),
                    n.nationality = coalesce($nationality, n.nationality),
                    n.last_seen = coalesce($last_seen, n.last_seen)
                """
                sources = [s.get("source_id") for s in entity.get("sources", []) if s.get("source_id")]
                
                try:
                    session.run(query, 
                        id=entity["entity_id"], 
                        name=entity["name"],
                        normalized_name=entity["normalized_name"],
                        sources=sources,
                        dob=entity.get("dob"),
                        nationality=entity.get("nationality"),
                        last_seen=entity.get("last_seen")
                    )
                except Exception as e:
                    logger.error(f"Error creating node {entity['entity_id']}: {e}")
                    
            # Create relationships based on mongodb_client.db.relationships
            rel_cursor = mongodb_client.db.relationships.find({})
            relationships = await rel_cursor.to_list(length=5000)
            
            for rel in relationships:
                rel_type = rel.get("type", "LINKED").upper()
                query = f"""
                MATCH (a), (b)
                WHERE a.name = $source_name AND b.name = $target_name
                MERGE (a)-[r:{rel_type}]->(b)
                SET r.weight = $weight, r.duration = $duration, r.source_upload_id = $source_upload_id
                """
                try:
                    session.run(query,
                        source_name=rel.get("source_name"),
                        target_name=rel.get("target_name"),
                        weight=rel.get("weight", 1.0),
                        duration=rel.get("metadata", {}).get("duration", 0),
                        source_upload_id=rel.get("source_upload_id", "")
                    )
                except Exception as e:
                    logger.error(f"Error creating relationship: {e}")
                    
            # Calculate dynamic risk score based on degree centrality (connections)
            logger.info("Updating risk scores based on graph connectivity")
            centrality_query = """
            MATCH (n)
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(r) as degree
            WITH n, degree, 
                 CASE 
                    WHEN n.type = 'PHONE' THEN 
                        CASE 
                            WHEN degree >= 4 THEN 95
                            WHEN degree = 3 THEN 80
                            WHEN degree = 2 THEN 65
                            ELSE 50
                        END
                    WHEN n.type = 'PERSON' THEN
                        CASE
                            WHEN degree >= 3 THEN 95
                            WHEN degree = 2 THEN 90
                            ELSE 85
                        END
                    ELSE 
                        CASE
                            WHEN degree >= 3 THEN 60
                            WHEN degree = 2 THEN 40
                            ELSE 25
                        END
                 END as new_score
            SET n.risk_score = new_score
            """
            try:
                session.run(centrality_query)
            except Exception as e:
                logger.error(f"Error updating centrality risk scores: {e}")
        
        logger.info("Graph build complete.")
