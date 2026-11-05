import os
import sys
import json
import numpy as np
import joblib
from datetime import datetime
from typing import Dict, Any, List, Optional

# Ensure app imports resolve regardless of execution environment
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_FILE_DIR, "..", ".."))
ROOT_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
for p in [BACKEND_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.services.preprocessing import preprocess_text
from app.services.keyword_extractor import extract_suspicious_keywords
from app.services.threat_analyzer import run_deep_threat_analysis

def _resolve_models_dir() -> str:
    candidates = [
        os.path.abspath(os.path.join(CURRENT_FILE_DIR, "..", "..", "models")),
        os.path.abspath(os.path.join(CURRENT_FILE_DIR, "..", "models")),
        os.path.abspath(os.path.join(os.getcwd(), "backend", "models")),
        os.path.abspath(os.path.join(os.getcwd(), "models")),
        "/var/task/backend/models",
        "/var/task/models",
    ]
    for d in candidates:
        if os.path.exists(os.path.join(d, "spam_model.pkl")):
            return d
    return candidates[0]

def _get_history_write_path(primary_path: str, filename: str) -> str:
    # If in Vercel or AWS Lambda, write to /tmp (only writable directory)
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return os.path.join("/tmp", filename)
    try:
        pdir = os.path.dirname(primary_path)
        if os.path.exists(pdir) and os.access(pdir, os.W_OK):
            return primary_path
    except Exception:
        pass
    return os.path.join("/tmp", filename)

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
            models_dir = _resolve_models_dir()
            model_p = os.path.join(models_dir, "spam_model.pkl")
            vect_p = os.path.join(models_dir, "tfidf_vectorizer.pkl")
            metrics_p = os.path.join(models_dir, "model_metrics.json")

            if os.path.exists(model_p) and os.path.exists(vect_p):
                self.model = joblib.load(model_p)
                self.vectorizer = joblib.load(vect_p)
                self.is_loaded = True
                print(f"ML Model and TF-IDF Vectorizer successfully loaded from {models_dir}.")
            else:
                print(f"Warning: Model files not found in {models_dir}")
            
            if os.path.exists(metrics_p):
                with open(metrics_p, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)
        except Exception as e:
            print(f"Error loading model artifacts: {e}")
            self.is_loaded = False

    def _load_history(self):
        tmp_history = os.path.join("/tmp", "prediction_history.json")
        primary_history = os.path.join(_resolve_models_dir(), "prediction_history.json")
        path_to_load = tmp_history if os.path.exists(tmp_history) else primary_history

        if os.path.exists(path_to_load):
            try:
                with open(path_to_load, "r", encoding="utf-8") as f:
                    self.prediction_history = json.load(f)
            except Exception:
                self.prediction_history = []
        else:
            self.prediction_history = []

    def _save_history(self):
        primary_history = os.path.join(_resolve_models_dir(), "prediction_history.json")
        target_path = _get_history_write_path(primary_history, "prediction_history.json")
        try:
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(self.prediction_history[-1000:], f, indent=2)
        except Exception as e:
            try:
                with open(os.path.join("/tmp", "prediction_history.json"), "w", encoding="utf-8") as f:
                    json.dump(self.prediction_history[-1000:], f, indent=2)
            except Exception as e2:
                print(f"Warning: Could not save prediction history: {e2}")

    def predict(self, subject: str, body: str, sender: str = "") -> Dict[str, Any]:
        if not self.is_loaded or self.model is None or self.vectorizer is None:
            # Attempt reloading in case serverless runtime spun up dynamically
            self._load_artifacts()
            if not self.is_loaded or self.model is None or self.vectorizer is None:
                raise RuntimeError("ML model is not loaded properly. Please verify model artifacts exist.")

        clean_subject = (subject or "").strip()
        clean_body = (body or "").strip()
        clean_sender = (sender or "").strip()

        if not clean_subject and not clean_body and not clean_sender:
            raise ValueError("Email sender, subject, and body cannot all be empty.")

        # Text passed to NLP ML vectorizer
        if clean_subject or clean_body:
            raw_text = f"{clean_subject} {clean_body}".strip()
        else:
            raw_text = clean_sender

        # 1. Preprocess
        processed = preprocess_text(raw_text)
        
        # 2. Vectorize
        features = self.vectorizer.transform([processed])
        
        # 3. Predict & Probability
        pred_label_idx = self.model.predict(features)[0]
        
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(features)[0]
            ham_prob = float(probs[0])
            spam_prob = float(probs[1])
        else:
            decision = self.model.decision_function(features)[0]
            spam_prob = float(1.0 / (1.0 + np.exp(-decision)))
            ham_prob = 1.0 - spam_prob
            
        initial_prediction = "spam" if pred_label_idx == 1 else "ham"
        
        # 4. Multi-Layer Deep Threat Analysis (Heuristics, Spoofing, URLs, Urgency)
        threat_info = run_deep_threat_analysis(
            subject=clean_subject,
            body=clean_body,
            sender=clean_sender,
            ml_prediction=initial_prediction,
            ml_spam_prob=spam_prob
        )

        # Elevate to spam if high-risk threat vector confirmed (e.g. brand spoofing or credential phishing)
        if threat_info["threat_level"] in ["Critical Threat", "High Risk"] and threat_info["risk_score"] >= 65:
            prediction = "spam"
            spam_prob = max(spam_prob, round(threat_info["risk_score"] / 100.0, 4))
            ham_prob = round(1.0 - spam_prob, 4)
        else:
            prediction = initial_prediction

        confidence = float(spam_prob * 100.0 if prediction == "spam" else ham_prob * 100.0)
        
        # 5. Keyword Explainability
        top_keywords, keyword_details, explanation = extract_suspicious_keywords(
            raw_text=raw_text,
            processed_text=processed,
            vectorizer=self.vectorizer,
            model=self.model,
            top_n=6,
            prediction=prediction
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
            "timestamp": timestamp,
            "risk_score": threat_info["risk_score"],
            "threat_level": threat_info["threat_level"],
            "threat_category": threat_info["threat_category"],
            "urgency_level": threat_info["urgency_level"],
            "security_checks": threat_info["security_checks"],
            "urls_detected": threat_info["urls_detected"],
            "sender_analysis": threat_info["sender_analysis"],
            "recommendations": threat_info["recommendations"],
            "tamil_summary": threat_info["tamil_summary"]
        }
        
        # Record in history
        history_entry = {
            "id": len(self.prediction_history) + 1,
            "sender": clean_sender,
            "subject": clean_subject,
            "body": clean_body,
            "subject_snippet": (clean_subject[:60] if clean_subject else clean_body[:60]) or clean_sender[:60] or "No Subject",
            "prediction": prediction,
            "confidence": round(confidence, 1),
            "spam_probability": round(spam_prob, 4),
            "ham_probability": round(ham_prob, 4),
            "keywords": top_keywords,
            "keyword_details": keyword_details,
            "explanation": explanation,
            "timestamp": timestamp,
            "risk_score": threat_info["risk_score"],
            "threat_level": threat_info["threat_level"],
            "threat_category": threat_info["threat_category"],
            "urgency_level": threat_info["urgency_level"],
            "tamil_summary": threat_info["tamil_summary"]
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
        primary_feedback = os.path.join(_resolve_models_dir(), "user_feedback.json")
        target_path = _get_history_write_path(primary_feedback, "user_feedback.json")
        try:
            feedbacks = []
            if os.path.exists(target_path):
                with open(target_path, "r", encoding="utf-8") as f:
                    feedbacks = json.load(f)
            feedbacks.append({
                "timestamp": datetime.now().isoformat(),
                "is_correct": is_correct,
                "feedback": feedback_text
            })
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(feedbacks[-200:], f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save feedback: {e}")

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "status": "healthy" if self.is_loaded else "unhealthy",
            "model_loaded": self.is_loaded,
            "metrics": self.metrics
        }

# Global singleton
predictor_service = SpamPredictorService()
