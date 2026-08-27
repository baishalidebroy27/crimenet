from celery import Celery
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app.config import settings

celery_app = Celery(
    "crimenet_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)

@celery_app.task(name="process_upload")
def process_upload_task(upload_ids: list, options: dict):
    # Import pipelines here to avoid circular imports
    from app.pipelines.sources.fir_pipeline import FIRPipeline
    from app.pipelines.sources.cdr_pipeline import CDRPipeline
    from app.pipelines.entity_resolver import EntityResolver
    from app.pipelines.graph_builder import GraphBuilder
    from app.pipelines.blockchain_pipeline import BlockchainPipeline
    import asyncio
    
    async def _run_pipelines():
        from app.db.neo4j_client import neo4j_client
        from app.db.mongodb_client import mongodb_client
        neo4j_client.connect()
        mongodb_client.connect()
        
        for upload_id in upload_ids:
            import glob
            
            file_type = "fir" if "fir" in upload_id else "cdr"
            matching_files = glob.glob(f"{settings.upload_dir}/{upload_id}.*")
            
            if matching_files:
                file_path = matching_files[0]
                if file_type == "fir":
                    pipeline = FIRPipeline(upload_id)
                else:
                    pipeline = CDRPipeline(upload_id)
                    
                await pipeline.run(file_path)
                
                # Blockchain Verification
                bc_pipeline = BlockchainPipeline(upload_id)
                file_hash = await bc_pipeline.extract(file_path)
                verification_data = await bc_pipeline.process(file_hash)
                await bc_pipeline.store(verification_data)
                
        resolver = EntityResolver()
        await resolver.resolve()
        
        builder = GraphBuilder()
        await builder.build()
        
        return {"status": "completed", "upload_ids": upload_ids}
        
    return asyncio.run(_run_pipelines())
