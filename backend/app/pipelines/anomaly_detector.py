import logging
from datetime import datetime
import uuid

from app.db.mongodb_client import mongodb_client

logger = logging.getLogger(__name__)

class AnomalyDetector:
    def __init__(self):
        pass

    async def run(self):
        logger.info("Running Anomaly Detection")
        if not mongodb_client.db:
            return
            
        cursor = mongodb_client.db.relationships.find({"type": "CALLED"})
        calls = await cursor.to_list(length=10000)
        
        call_counts = {}
        for c in calls:
            caller = c.get("source_name")
            if caller:
                call_counts[caller] = call_counts.get(caller, 0) + c.get("metadata", {}).get("call_count", 1)
            
        anomalies = []
        for caller, count in call_counts.items():
            if count > 40:
                logger.warning(f"Anomaly detected: {caller} made {count} calls")
                anomalies.append({
                    "anomaly_id": f"A_{uuid.uuid4().hex[:8]}",
                    "type": "unusual_call_pattern",
                    "severity": "high",
                    "entity_id": caller,
                    "entity_name": caller,
                    "description": f"{count} calls detected (highly unusual)",
                    "baseline_value": 15,
                    "observed_value": count,
                    "deviation_factor": round(count / 15.0, 2),
                    "confidence": 0.92,
                    "detected_at": datetime.utcnow(),
                    "investigated": False,
                    "status": "open"
                })
                
        if anomalies:
            try:
                await mongodb_client.db.anomalies.insert_many(anomalies, ordered=False)
                logger.info(f"Stored {len(anomalies)} anomalies")
            except Exception as e:
                logger.error(f"Error storing anomalies: {e}")
