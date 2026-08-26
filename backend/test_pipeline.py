import asyncio
import os
import sys

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.pipelines.sources.fir_pipeline import FIRPipeline
from app.pipelines.sources.cdr_pipeline import CDRPipeline
from app.pipelines.entity_resolver import EntityResolver
from app.pipelines.graph_builder import GraphBuilder
from app.db.mongodb_client import mongodb_client

async def test_run():
    # Connect to MongoDB
    mongodb_client.connect()
    
    # 1. Run FIR
    print("Running FIR Pipeline...")
    fir = FIRPipeline("sample_fir")
    await fir.run("d:/crimenet/backend/data/uploads/sample_fir.txt")
    
    # 2. Run CDR
    print("Running CDR Pipeline...")
    cdr = CDRPipeline("sample_cdr")
    await cdr.run("d:/crimenet/backend/data/uploads/sample_cdr.txt")
    
    # 3. Entity Resolution
    print("Running Entity Resolver...")
    resolver = EntityResolver()
    await resolver.resolve()
    
    # 4. Graph Builder
    print("Running Graph Builder...")
    builder = GraphBuilder()
    await builder.build()
    
    # Verify Neo4j graph nodes
    from app.db.neo4j_client import neo4j_client
    neo4j_client.connect()
    driver = neo4j_client.get_driver()
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN n")
        nodes = result.data()
        print(f"Total nodes in Neo4j: {len(nodes)}")
        
        result2 = session.run("MATCH ()-[r]->() RETURN r")
        edges = result2.data()
        print(f"Total edges in Neo4j: {len(edges)}")
        
    mongodb_client.close()
    await neo4j_client.close()

if __name__ == "__main__":
    asyncio.run(test_run())
