import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings
from app.db.neo4j_client import neo4j_client
from app.db.mongodb_client import mongodb_client
from app.db.redis_client import redis_client

async def test_run():
    mongodb_client.connect()
    neo4j_client.connect()
    
    # get a random upload file
    import glob
    files = glob.glob(f"{settings.upload_dir}/*")
    if not files:
        print("No files to process")
        return
        
    print(f"Testing with file: {files[0]}")
    filename = os.path.basename(files[0])
    upload_id = filename.split('.')[0]
    
    if "fir" in upload_id or "FIR" in filename.upper():
        from app.pipelines.sources.fir_pipeline import FIRPipeline
        pipeline = FIRPipeline(upload_id)
        print("Running FIR pipeline")
    else:
        from app.pipelines.sources.cdr_pipeline import CDRPipeline
        pipeline = CDRPipeline(upload_id)
        print("Running CDR pipeline")
        
    await pipeline.run(files[0])
    
    from app.pipelines.entity_resolver import EntityResolver
    resolver = EntityResolver()
    await resolver.resolve()
    
    from app.pipelines.graph_builder import GraphBuilder
    builder = GraphBuilder()
    await builder.build()
    
    print("Done")

asyncio.run(test_run())
