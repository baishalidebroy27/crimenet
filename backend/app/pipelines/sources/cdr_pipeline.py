import pandas as pd
import logging
import uuid
from datetime import datetime

from app.pipelines.base import BasePipeline
from app.db.mongodb_client import mongodb_client

logger = logging.getLogger(__name__)

class CDRPipeline(BasePipeline):
    def __init__(self, upload_id: str):
        super().__init__(upload_id)
        self.relationships = []
        
    async def extract(self, file_path: str):
        logger.info(f"Extracting CDR data from CSV: {file_path}")
        try:
            df = pd.read_csv(file_path)
            return df
        except Exception as e:
            logger.error(f"Error reading CDR CSV: {e}")
            raise

    async def process(self, raw_data: pd.DataFrame):
        logger.info("Cleaning CDR DataFrame")
        raw_data.columns = [str(c).lower().strip() for c in raw_data.columns]
        
        for col in ['caller', 'receiver']:
            if col in raw_data.columns:
                raw_data[col] = raw_data[col].astype(str).str.replace(r'[\-\s]', '', regex=True)
                raw_data[col] = raw_data[col].apply(lambda x: f"+91{x}" if len(x) == 10 else x)
                
        if 'duration' in raw_data.columns:
            raw_data['duration'] = raw_data['duration'].fillna(0)
            
        return raw_data

    async def extract_entities(self, processed_data: pd.DataFrame):
        logger.info("Extracting Phone entities and relationships from CDR")
        entities = []
        unique_phones = set()
        
        if 'caller' in processed_data.columns:
            unique_phones.update(processed_data['caller'].unique())
        if 'receiver' in processed_data.columns:
            unique_phones.update(processed_data['receiver'].unique())
            
        for phone in unique_phones:
            if str(phone).lower() == 'nan': continue
            entities.append({
                "entity_id": f"TEMP_{uuid.uuid4().hex[:8]}",
                "type": "PHONE",
                "name": phone,
                "normalized_name": phone,
                "sources": [{
                    "source_id": self.upload_id,
                    "source_type": "cdr",
                    "confidence": 1.0,
                    "extracted_text": phone,
                    "extracted_at": datetime.utcnow()
                }]
            })
            
        for _, row in processed_data.iterrows():
            caller = str(row.get('caller', ''))
            receiver = str(row.get('receiver', ''))
            if caller == 'nan' or receiver == 'nan': continue
            
            self.relationships.append({
                "relationship_id": f"R_{uuid.uuid4().hex[:8]}",
                "type": "CALLED",
                "source_name": caller,
                "target_name": receiver,
                "weight": 1.0,
                "metadata": {
                    "duration": row.get('duration', 0),
                    "date": row.get('date', ''),
                    "time": row.get('time', ''),
                    "location": row.get('location', 'Unknown')
                },
                "source_upload_id": self.upload_id,
                "created_at": datetime.utcnow()
            })
            
        return entities

    async def store(self, entities: list):
        logger.info(f"Storing {len(entities)} entities and {len(self.relationships)} relationships to MongoDB")
        if mongodb_client.db is not None:
            if entities:
                try:
                    await mongodb_client.db.entities.insert_many(entities, ordered=False)
                except Exception as e:
                    logger.error(f"Error storing entities: {e}")
            if self.relationships:
                try:
                    await mongodb_client.db.relationships.insert_many(self.relationships, ordered=False)
                except Exception as e:
                    logger.error(f"Error storing relationships: {e}")
