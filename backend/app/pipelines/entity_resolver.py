import logging
from fuzzywuzzy import fuzz
from datetime import datetime

from app.db.mongodb_client import mongodb_client

logger = logging.getLogger(__name__)

class EntityResolver:
    def __init__(self):
        pass

    async def resolve(self):
        logger.info("Starting entity resolution process")
        if mongodb_client.db is None:
            return
            
        # Get unresolved entities
        cursor = mongodb_client.db.entities.find({"resolution_status": {"$ne": "resolved"}, "resolution_status": {"$ne": "merged"}})
        unresolved_entities = await cursor.to_list(length=5000)
        
        # Super simple O(N^2) matching for demo
        resolved_count = 0
        merged_count = 0
        
        for i, p1 in enumerate(unresolved_entities):
            if p1.get("resolution_status") == "merged":
                continue
                
            master_entity = p1.copy()
            master_entity["resolution_status"] = "resolved"
            master_entity["merged_from"] = [p1["entity_id"]]
            master_entity["entity_id"] = p1["entity_id"].replace("TEMP_", f"{p1.get('type', 'E')}_")
            
            for j in range(i+1, len(unresolved_entities)):
                p2 = unresolved_entities[j]
                if p2.get("resolution_status") == "merged" or p1.get("type") != p2.get("type"):
                    continue
                    
                # Fuzzy match name
                similarity = fuzz.ratio(p1.get("normalized_name", ""), p2.get("normalized_name", ""))
                
                if similarity > 80:
                    logger.info(f"Merging {p1['name']} with {p2['name']} (Score: {similarity})")
                    master_entity["sources"].extend(p2.get("sources", []))
                    master_entity["merged_from"].append(p2["entity_id"])
                    
                    p2["resolution_status"] = "merged"
                    p2["merged_into"] = master_entity["entity_id"]
                    
                    await mongodb_client.db.entities.update_one(
                        {"_id": p2["_id"]},
                        {"$set": {"resolution_status": "merged", "merged_into": master_entity["entity_id"]}}
                    )
                    merged_count += 1
            
            p1["resolution_status"] = "merged"
            p1["merged_into"] = master_entity["entity_id"]
            await mongodb_client.db.entities.update_one(
                {"_id": p1["_id"]},
                {"$set": {"resolution_status": "merged", "merged_into": master_entity["entity_id"]}}
            )
            
            del master_entity["_id"]
            await mongodb_client.db.entities.insert_one(master_entity)
            resolved_count += 1
            
        logger.info(f"Entity resolution complete. Resolved {resolved_count} unique entities, merged {merged_count} duplicates.")
