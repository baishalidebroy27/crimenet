import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings
from app.db.neo4j_client import neo4j_client
from app.db.mongodb_client import mongodb_client

async def test_fir():
    mongodb_client.connect()
    neo4j_client.connect()
    
    # Create a dummy FIR file
    dummy_file = f"{settings.upload_dir}/fir_eca3c3d2.txt"
    from app.pipelines.sources.fir_pipeline import FIRPipeline
    pipeline = FIRPipeline("fir_eca3c3d2")
    print("Running FIR pipeline")
    await pipeline.run(dummy_file)
    
    from app.pipelines.entity_resolver import EntityResolver
    resolver = EntityResolver()
    await resolver.resolve()
    
    from app.pipelines.graph_builder import GraphBuilder
    builder = GraphBuilder()
    await builder.build()
    
    print("Done FIR")

asyncio.run(test_fir())
