import hashlib
import logging
import uuid
from datetime import datetime
from app.pipelines.base import BasePipeline
from app.db.mongodb_client import mongodb_client

logger = logging.getLogger(__name__)

class BlockchainPipeline(BasePipeline):
    def __init__(self, upload_id: str):
        super().__init__(upload_id)
        
    async def extract(self, file_path: str):
        logger.info(f"Computing hash for file: {file_path}")
        sha256_hash = hashlib.sha256()
        try:
            import aiofiles
            async with aiofiles.open(file_path, "rb") as f:
                while True:
                    byte_block = await f.read(4096)
                    if not byte_block:
                        break
                    sha256_hash.update(byte_block)
        except Exception as e:
            logger.error(f"Error reading file for hashing {file_path}: {e}")
            raise
            
        return sha256_hash.hexdigest()

    async def process(self, file_hash: str):
        logger.info(f"Simulating blockchain transaction for hash: {file_hash}")
        # Mock transaction generation
        tx_id = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
        return {
            "hash": file_hash,
            "blockchain_tx_id": tx_id,
            "timestamp": datetime.utcnow()
        }

    async def extract_entities(self, processed_data):
        # Blockchain pipeline does not extract entities
        return []

    async def store(self, verification_data: dict):
        logger.info(f"Updating upload record {self.upload_id} with blockchain data")
        if not verification_data:
            return
            
        if mongodb_client.db is not None:
            try:
                await mongodb_client.db.uploads.update_one(
                    {"upload_id": self.upload_id},
                    {"$set": {
                        "blockchain_hash": verification_data["hash"],
                        "blockchain_tx_id": verification_data["blockchain_tx_id"],
                        "blockchain_timestamp": verification_data["timestamp"],
                        "blockchain_verified": True
                    }}
                )
            except Exception as e:
                logger.error(f"Error updating blockchain verification for upload {self.upload_id}: {e}")
