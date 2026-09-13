import logging
import glob
import traceback
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)

async def run_pipelines(upload_ids: list):
    try:
        from app.db.neo4j_client import neo4j_client
        from app.db.mongodb_client import mongodb_client
        
        # Connect to DBs if not already connected
        neo4j_client.connect()
        mongodb_client.connect()
        
        for upload_id in upload_ids:
            try:
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
                    
                    # Blockchain verification is now handled securely during the upload phase
                    # to ensure immediate file integrity locking before any processing occurs.
                        
            except Exception as e:
                logger.error(f"Error processing {upload_id}: {e}")
                if mongodb_client.db is not None:
                    await mongodb_client.db.uploads.update_one(
                        {"upload_id": upload_id},
                        {"$set": {"status": "error", "error_message": str(e), "error_trace": traceback.format_exc()}}
                    )

        # Run Global Pipelines
        from app.pipelines.entity_resolver import EntityResolver
        from app.pipelines.graph_builder import GraphBuilder
        
        resolver = EntityResolver()
        await resolver.resolve()
        
        builder = GraphBuilder()
        await builder.build()
        
        # If all processed correctly, mark status completed
        if mongodb_client.db is not None:
            for upload_id in upload_ids:
                upload = await mongodb_client.db.uploads.find_one({"upload_id": upload_id})
                if upload and upload.get("status") != "error":
                    await mongodb_client.db.uploads.update_one(
                        {"upload_id": upload_id},
                        {"$set": {"status": "completed"}}
                    )
                    
    except Exception as e:
        logger.error(f"Global pipeline error: {e}")
        from app.db.mongodb_client import mongodb_client
        if mongodb_client.db is not None:
            for upload_id in upload_ids:
                await mongodb_client.db.uploads.update_one(
                    {"upload_id": upload_id},
                    {"$set": {"status": "error", "error_message": f"Global Error: {str(e)}", "error_trace": traceback.format_exc()}}
                )
