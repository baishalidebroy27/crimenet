import joblib
import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)

class RiskScorer:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(settings.model_path):
                self.model = joblib.load(settings.model_path)
                logger.info("Risk model loaded successfully")
            else:
                logger.warning("Risk model not found. Using rule-based fallback.")
        except Exception as e:
            logger.error(f"Error loading model: {e}")

    def predict(self, features: list):
        if self.model:
            # Expected features: [criminal_history, pagerank, recent_calls, transaction_total, anomalies]
            score_prob = self.model.predict_proba([features])[0][1] # Probability of HIGH risk
            score = int(score_prob * 100)
        else:
            # Fallback rule-based
            score = min(100, int(
                (features[0] * 10) + 
                (features[1] * 5) + 
                (features[2] * 0.5)
            ))
            
        if score > 66:
            level = "HIGH"
        elif score > 33:
            level = "MEDIUM"
        else:
            level = "LOW"
            
        return score, level
