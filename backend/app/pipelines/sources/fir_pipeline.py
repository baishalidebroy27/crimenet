import pdfplumber
import spacy
import re
import logging
import uuid
from datetime import datetime

from app.pipelines.base import BasePipeline
from app.db.mongodb_client import mongodb_client

logger = logging.getLogger(__name__)

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("Spacy model 'en_core_web_sm' not found. Run python -m spacy download en_core_web_sm")
    nlp = None

class FIRPipeline(BasePipeline):
    def __init__(self, upload_id: str):
        super().__init__(upload_id)
        
    async def extract(self, file_path: str):
        logger.info(f"Extracting text from FIR: {file_path}")
        text = ""
        try:
            if file_path.endswith('.txt'):
                import aiofiles
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    text = await f.read()
            else:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
        except Exception as e:
            logger.error(f"Error extracting FIR file {file_path}: {e}")
            raise
        return text

    async def process(self, raw_data: str):
        logger.info("Cleaning FIR text")
        cleaned = re.sub(r'\s+', ' ', raw_data).strip()
        return cleaned

    async def extract_entities(self, processed_data: str):
        logger.info("Extracting entities using spaCy and Regex")
        entities = []
        if not nlp:
            logger.error("Spacy model not loaded.")
            return entities
            
        doc = nlp(processed_data)
        
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "GPE", "DATE"]:
                entity_type = ent.label_
                if entity_type == "GPE":
                    entity_type = "LOCATION"
                    
                entities.append({
                    "entity_id": f"TEMP_{uuid.uuid4().hex[:8]}",
                    "type": entity_type,
                    "name": ent.text,
                    "normalized_name": ent.text.lower(),
                    "sources": [{
                        "source_id": self.upload_id,
                        "source_type": "fir",
                        "confidence": 0.8,
                        "extracted_text": ent.text,
                        "extracted_at": datetime.utcnow()
                    }]
                })
                
        phone_pattern = r'(\+91[\-\s]?)?[6-9]\d{9}'
        for match in re.finditer(phone_pattern, processed_data):
            phone = match.group()
            normalized_phone = phone.replace("-", "").replace(" ", "")
            if not normalized_phone.startswith("+91"):
                normalized_phone = "+91" + normalized_phone[-10:]
                
            entities.append({
                "entity_id": f"TEMP_{uuid.uuid4().hex[:8]}",
                "type": "PHONE",
                "name": normalized_phone,
                "normalized_name": normalized_phone,
                "sources": [{
                    "source_id": self.upload_id,
                    "source_type": "fir",
                    "confidence": 1.0,
                    "extracted_text": phone,
                    "extracted_at": datetime.utcnow()
                }]
            })
            
        # Create ASSOCIATED_WITH relationships between all entities found in this FIR
        self.relationships = getattr(self, 'relationships', [])
        for i in range(len(entities)):
            for j in range(i+1, len(entities)):
                if entities[i]['name'] != entities[j]['name']:
                    self.relationships.append({
                        "relationship_id": f"R_{uuid.uuid4().hex[:8]}",
                        "type": "ASSOCIATED_WITH",
                        "source_name": entities[i]['name'],
                        "target_name": entities[j]['name'],
                        "weight": 0.5,
                        "metadata": {"source": "FIR_CO_OCCURRENCE"},
                        "source_upload_id": self.upload_id,
                        "created_at": datetime.utcnow()
                    })
            
        return entities

    async def store(self, entities: list):
        logger.info(f"Storing {len(entities)} entities to MongoDB")
        if not entities:
            return
            
        if mongodb_client.db is not None:
            try:
                await mongodb_client.db.entities.insert_many(entities, ordered=False)
            except Exception as e:
                logger.error(f"Error storing entities: {e}")
                
            relationships = getattr(self, 'relationships', [])
            if relationships:
                try:
                    await mongodb_client.db.relationships.insert_many(relationships, ordered=False)
                except Exception as e:
                    logger.error(f"Error storing FIR relationships: {e}")
