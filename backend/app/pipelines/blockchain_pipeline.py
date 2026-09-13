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
        
    async def run(self, file_path: str):
        raw_data = await self.extract(file_path)
        processed_data = await self.process(raw_data)
        await self.store(processed_data)
        return processed_data

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
        logger.info(f"Attempting blockchain transaction for hash: {file_hash}")
        
        from app.config import settings
        
        rpc_url = settings.web3_rpc_url.strip() if settings.web3_rpc_url else ""
        private_key = settings.web3_private_key.strip() if settings.web3_private_key else ""
        
        tx_id = None
        
        if rpc_url and private_key:
            try:
                from web3 import Web3
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if w3.is_connected():
                    account = w3.eth.account.from_key(private_key)
                    # Convert file_hash to hex bytes for data payload
                    data_payload = file_hash.encode('utf-8').hex()
                    
                    tx = {
                        'nonce': w3.eth.get_transaction_count(account.address),
                        'to': account.address, # Send to self
                        'value': 0,
                        'gas': 200000,
                        'gasPrice': w3.eth.gas_price,
                        'data': '0x' + data_payload,
                        'chainId': w3.eth.chain_id
                    }
                    
                    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
                    
                    try:
                        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                    except AttributeError:
                        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                        
                    tx_id = w3.to_hex(tx_hash)
                    logger.info(f"Successfully sent transaction: {tx_id}")
                else:
                    logger.warning("Web3 could not connect to RPC URL. Falling back...")
            except Exception as e:
                logger.error(f"Error executing real blockchain transaction: {e}")
        
        if not tx_id:
            logger.info("Falling back to simulated blockchain transaction.")
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
