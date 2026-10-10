import os
import json
import joblib
from datetime import datetime
from typing import Dict, Any, List

from app.services.preprocessing import preprocess_text
from app.services.keyword_extractor import extract_suspicious_keywords

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "models"))
MODEL_PATH = os.path.join(MODELS_DIR, "spam_model.pkl")
VECTORIZER_PATH = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics.json")
HISTORY_PATH = os.path.join(MODELS_DIR, "prediction_history.json")

class SpamPredictorService:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.metrics = {}
        self.is_loaded = False
        self.prediction_history: List[Dict[str, Any]] = []
        self._load_artifacts()
        self._load_history()

    def _load_artifacts(self):
        try:
            if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                self.is_loaded = True
                print("ML Model and TF-IDF Vectorizer successfully loaded.")
            else:
                print(f"Warning: Model files not found at {MODELS_DIR}")
            
            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
        except Exception as e:
            print(f"Error loading model artifacts: {e}")
            self.is_loaded = False

    def _load_history(self):
        if os.path.exists(HISTORY_PATH):
            try:
                with open(HISTORY_PATH, "r") as f:
                    self.prediction_history = json.load(f)
            except Exception:
                self.prediction_history = []
        else:
            self.prediction_history = []

    def _save_history(self):
        try:
            with open(HISTORY_PATH, "w") as f:
                json.dump(self.prediction_history[-100:], f, indent=2) # keep last 100
        except Exception as e:
            print(f"Error saving history: {e}")

    def predict(self, subject: str, body: str, sender: str = "") -> Dict[str, Any]:
        if not self.is_loaded or self.model is None or self.vectorizer is None:
            raise RuntimeError("ML model is not loaded properly.")

        raw_combined = f"{sender} {subject} {body}".strip() if (sender or subject) else body.strip()
        if not raw_combined:
            raise ValueError("Email sender, subject, and body cannot all be empty.")

        # 1. Preprocess
        processed = preprocess_text(raw_combined)
        
        # 2. Vectorize
        features = self.vectorizer.transform([processed])
        
        # 3. Predict & Probability
        pred_label_idx = self.model.predict(features)[0]
        
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(features)[0]
            ham_prob = float(probs[0])
            spam_prob = float(probs[1])
        else:
            # Fallback for decision function models
            decision = self.model.decision_function(features)[0]
            # Sigmoid conversion
            spam_prob = float(1.0 / (1.0 + np.exp(-decision)))
            ham_prob = 1.0 - spam_prob
            
        prediction = "spam" if pred_label_idx == 1 else "ham"
        confidence = float(spam_prob * 100.0 if prediction == "spam" else ham_prob * 100.0)
        
        # 4. Keyword Explainability
        top_keywords, keyword_details, explanation = extract_suspicious_keywords(
            raw_text=raw_combined,
            processed_text=processed,
            vectorizer=self.vectorizer,
            model=self.model,
            top_n=6
        )
        
        timestamp = datetime.now().isoformat()
        
        result = {
            "prediction": prediction,
            "spam_probability": round(spam_prob, 4),
            "ham_probability": round(ham_prob, 4),
            "confidence": round(confidence, 1),
            "keywords": top_keywords,
            "keyword_details": keyword_details,
            "explanation": explanation,
            "processed_text": processed,
            "timestamp": timestamp
        }
        
        # Record in history
        history_entry = {
            "id": len(self.prediction_history) + 1,
            "sender": sender,
            "subject": subject,
            "body": body,
            "subject_snippet": (subject[:60] if subject else body[:60]) or "No Subject",
            "prediction": prediction,
            "confidence": round(confidence, 1),
            "spam_probability": round(spam_prob, 4),
            "ham_probability": round(ham_prob, 4),
            "keywords": top_keywords,
            "keyword_details": keyword_details,
            "explanation": explanation,
            "timestamp": timestamp
        }
        self.prediction_history.append(history_entry)
        self._save_history()

        return result

    def get_statistics(self) -> Dict[str, Any]:
        total = len(self.prediction_history)
        spam_cnt = sum(1 for p in self.prediction_history if p.get("prediction") == "spam")
        ham_cnt = sum(1 for p in self.prediction_history if p.get("prediction") == "ham")
        
        spam_pct = round((spam_cnt / total * 100.0), 1) if total > 0 else 0.0
        ham_pct = round((ham_cnt / total * 100.0), 1) if total > 0 else 0.0

        return {
            "total_predictions": total,
            "spam_count": spam_cnt,
            "ham_count": ham_cnt,
            "spam_percentage": spam_pct,
            "ham_percentage": ham_pct,
            "recent_predictions": list(reversed(self.prediction_history[-10:])),
            "history": list(reversed(self.prediction_history))
        }

    def clear_history(self):
        self.prediction_history = []
        self._save_history()

    def record_feedback(self, is_correct: bool, feedback_text: str = ""):
        feedback_log_path = os.path.join(MODELS_DIR, "user_feedback.json")
        try:
            feedbacks = []
            if os.path.exists(feedback_log_path):
                with open(feedback_log_path, "r") as f:
                    feedbacks = json.load(f)
            feedbacks.append({
                "timestamp": datetime.now().isoformat(),
                "is_correct": is_correct,
                "feedback": feedback_text
            })
            with open(feedback_log_path, "w") as f:
                json.dump(feedbacks[-200:], f, indent=2)
        except Exception as e:
            print(f"Error recording feedback: {e}")

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "status": "healthy" if self.is_loaded else "unhealthy",
            "model_loaded": self.is_loaded,
            "metrics": self.metrics
        }

# Global singleton
predictor_service = SpamPredictorService()
