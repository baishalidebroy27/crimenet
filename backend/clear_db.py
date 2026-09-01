import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.mongodb_client import mongodb_client
from app.db.neo4j_client import neo4j_client

async def clear():
    mongodb_client.connect()
    neo4j_client.connect()
    
    await mongodb_client.db.entities.delete_many({})
    await mongodb_client.db.relationships.delete_many({})
    await mongodb_client.db.uploads.delete_many({})
    
    driver = neo4j_client.get_driver()
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        
    print("Database cleared!")

asyncio.run(clear())
