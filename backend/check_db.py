import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from neo4j import GraphDatabase

async def check_db():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['crimenet']
    entities = await db.entities.count_documents({})
    relationships = await db.relationships.count_documents({})
    print(f'Mongo Entities: {entities}, Relationships: {relationships}')
    
    driver = GraphDatabase.driver('neo4j://localhost:7687', auth=('neo4j', 'StrongPassword123'))
    with driver.session() as session:
        res = session.run('MATCH (n) RETURN count(n) as c')
        print(f'Neo4j Nodes: {res.single()[0]}')
        res2 = session.run('MATCH ()-[r]->() RETURN count(r) as c')
        print(f'Neo4j Edges: {res2.single()[0]}')

asyncio.run(check_db())
