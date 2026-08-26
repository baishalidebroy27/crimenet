from fastapi import APIRouter
from app.db.mongodb_client import mongodb_client
from app.db.neo4j_client import neo4j_client

router = APIRouter()

@router.get("/stats")
async def system_stats():
    return {"uploads": {}, "processing": {}, "graph": {}}

@router.post("/clear")
async def clear_database():
    try:
        # Clear MongoDB
        if mongodb_client.db is not None:
            await mongodb_client.db.entities.drop()
            await mongodb_client.db.relationships.drop()
            await mongodb_client.db.uploads.drop()
            
        # Clear Neo4j
        driver = neo4j_client.get_driver()
        if driver is not None:
            with driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
                
        return {"status": "success", "message": "Database wiped completely"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
