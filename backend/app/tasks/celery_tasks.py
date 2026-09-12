from celery import Celery
import os
import sys
import ssl

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
    broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE} if settings.redis_url.startswith("rediss://") else None,
    redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE} if settings.redis_url.startswith("rediss://") else None,
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
        try:
            from app.db.neo4j_client import neo4j_client
            from app.db.mongodb_client import mongodb_client
            neo4j_client.connect()
            mongodb_client.connect()
            
            for upload_id in upload_ids:
                try:
                    import glob
                    
                    file_type = "fir" if "fir" in upload_id else "cdr"
                    matching_files = glob.glob(f"{settings.upload_dir}/{upload_id}.*")
                    
                    if matching_files:
                        file_path = matching_files[0]
                        if file_type == "fir":
                            from app.pipelines.sources.fir_pipeline import FIRPipeline
                            pipeline = FIRPipeline(upload_id)
                        else:
                            from app.pipelines.sources.cdr_pipeline import CDRPipeline
                            pipeline = CDRPipeline(upload_id)
                            
                        await pipeline.run(file_path)
                        
                        # Blockchain Verification
                        from app.pipelines.blockchain_pipeline import BlockchainPipeline
                        bc_pipeline = BlockchainPipeline(upload_id)
                        file_hash = await bc_pipeline.extract(file_path)
                        verification_data = await bc_pipeline.process(file_hash)
                        await bc_pipeline.store(verification_data)
                        
                except Exception as e:
                    import traceback
                    logger.error(f"Error processing {upload_id}: {e}")
                    if mongodb_client.db is not None:
                        await mongodb_client.db.uploads.update_one(
                            {"upload_id": upload_id},
                            {"$set": {"status": "error", "error_message": str(e), "error_trace": traceback.format_exc()}}
                        )
                    
            resolver = EntityResolver()
            await resolver.resolve()
            
            builder = GraphBuilder()
            await builder.build()
            
            # If all processed correctly, mark status completed
            if mongodb_client.db is not None:
                for upload_id in upload_ids:
                    # Only update if not already marked as error
                    upload = await mongodb_client.db.uploads.find_one({"upload_id": upload_id})
                    if upload and upload.get("status") != "error":
                        await mongodb_client.db.uploads.update_one(
                            {"upload_id": upload_id},
                            {"$set": {"status": "completed"}}
                        )
        except Exception as e:
            import traceback
            logger.error(f"Global pipeline error: {e}")
            from app.db.mongodb_client import mongodb_client
            if mongodb_client.db is not None:
                for upload_id in upload_ids:
                    await mongodb_client.db.uploads.update_one(
                        {"upload_id": upload_id},
                        {"$set": {"status": "error", "error_message": f"Global Error: {str(e)}", "error_trace": traceback.format_exc()}}
                    )

    return asyncio.run(_run_pipelines())
