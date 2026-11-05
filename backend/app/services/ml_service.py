"""
ML Inference, Explainability, and Transparent Risk Assessment Service.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
import joblib
import numpy as np

# Limit threads
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

from app.core.config import settings

# Add ml folder to sys.path so RuleBasedPhishingClassifier can unpickle properly
sys.path.insert(0, str(settings.ML_DIR))

class MLService:
    def __init__(self):
        self.artifacts_dir = settings.ARTIFACTS_DIR
        self.reports_dir = settings.REPORTS_DIR
        self.vectorizer = None
        self.models = {}
        self.feature_names = []
        self.model_metadata = {}
        self.is_loaded = False
        self._load_artifacts()

    def _load_artifacts(self):
        try:
            vec_path = self.artifacts_dir / "tfidf_vectorizer.joblib"
            if vec_path.exists():
                self.vectorizer = joblib.load(vec_path)
                self.feature_names = self.vectorizer.get_feature_names_out().tolist()

            for model_id in ["linear_svm", "logistic_regression", "naive_bayes", "rule_baseline"]:
                model_path = self.artifacts_dir / f"{model_id}.joblib"
                if model_path.exists():
                    self.models[model_id] = joblib.load(model_path)

            meta_path = self.artifacts_dir / "model_metadata.json"
            if meta_path.exists():
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.model_metadata = json.load(f)

            self.is_loaded = bool(self.vectorizer and self.models)
        except Exception as e:
            print(f"Warning: Failed to load ML artifacts: {e}")
            self.is_loaded = False

    def get_available_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "linear_svm",
                "name": "TF-IDF Linear SVM (Calibrated)",
                "description": "High-margin Support Vector Machine with Platt scaling calibrated probabilities",
                "supports_probability": True,
                "is_default": settings.DEFAULT_MODEL == "linear_svm"
            },
            {
                "id": "logistic_regression",
                "name": "TF-IDF Logistic Regression",
                "description": "L2-regularized linear model with log-odds probability calibration",
                "supports_probability": True,
                "is_default": settings.DEFAULT_MODEL == "logistic_regression"
            },
            {
                "id": "naive_bayes",
                "name": "Multinomial Naive Bayes",
                "description": "Probabilistic bag-of-words baseline with Dirichlet smoothing",
                "supports_probability": True,
                "is_default": settings.DEFAULT_MODEL == "naive_bayes"
            },
            {
                "id": "rule_baseline",
                "name": "Transparent Rule-Based Baseline",
                "description": "Deterministic pattern matching on urgency, credentials, wire fraud, and inert URL indicators",
                "supports_probability": False,
                "is_default": settings.DEFAULT_MODEL == "rule_baseline"
            }
        ]

    def extract_inert_urls(self, text: str) -> List[str]:
        """Safely isolate defanged or inert URLs from text."""
        urls = []
        for token in text.replace("\n", " ").split():
            clean = token.strip(".,;:()<>[]\"'")
            if "hxxp" in clean.lower() or "[.]" in clean or "http" in clean.lower() or "www." in clean.lower():
                # Defang if raw
                defanged = re.sub(r"https?://", "hxxps[://]", clean, flags=re.IGNORECASE)
                urls.append(defanged)
        return list(dict.fromkeys(urls))

    def check_abstention(self, text: str) -> Tuple[bool, Optional[str]]:
        """
        Determine if the model should abstain from making a confident prediction
        due to out-of-scope input, extreme brevity, or non-linguistic noise.
        """
        tokens = [t for t in re.findall(r"\b\w+\b", text) if not t.isdigit()]
        if len(tokens) < 3:
            return True, "Input contains fewer than 3 recognizable word tokens; insufficient context for statistical classification."
        
        # Check if entirely gibberish / repeated characters
        if len(text.strip()) > 30 and len(set(text.strip())) < 5:
            return True, "Input appears to consist of non-linguistic repetitive patterns outside validated training scope."

        return False, None

    def analyze_message(
        self,
        text: str,
        channel: str = "email",
        model_name: Optional[str] = None,
        high_threshold: Optional[float] = None,
        low_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Core risk analysis pipeline combining:
        1. Preprocessing & URL defanging
        2. Abstention & boundary evaluation
        3. Deterministic rule-based indicators
        4. Statistical ML probability estimation
        5. Feature attribution / explainability
        6. Prescriptive safety recommendations
        """
        if not self.is_loaded:
            self._load_artifacts()

        high_thresh = high_threshold if high_threshold is not None else settings.DEFAULT_HIGH_RISK_THRESHOLD
        low_thresh = low_threshold if low_threshold is not None else settings.DEFAULT_LOW_RISK_THRESHOLD
        selected_model_id = model_name if model_name in self.models else settings.DEFAULT_MODEL

        # 1. Defang URLs and extract inert references
        inert_urls = self.extract_inert_urls(text)
        
        # 2. Check Abstention
        abstained, abstain_reason = self.check_abstention(text)

        # 3. Rule-based indicator breakdown (always computed for transparency)
        rule_model = self.models.get("rule_baseline")
        if rule_model:
            rule_analysis = rule_model.analyze_indicators(text)
        else:
            rule_analysis = {"score": 0.5, "total_indicators_count": 0}

        # 4. ML Prediction
        model = self.models.get(selected_model_id, self.models.get("linear_svm"))
        
        if abstained:
            risk_score = 0.50
            confidence = 0.0
            risk_category = "Needs Review"
            requires_review = True
            attributions = []
        else:
            if selected_model_id == "rule_baseline":
                risk_score = rule_analysis["score"]
                confidence = round(float(abs(risk_score - 0.50) * 2.0), 4)
                attributions = []
            else:
                vec = self.vectorizer.transform([text])
                probs = model.predict_proba(vec)[0]
                # Prob of phishing (class 1)
                phish_idx = list(model.classes_).index("phishing") if hasattr(model, "classes_") else 1
                risk_score = round(float(probs[phish_idx]), 4)
                confidence = round(float(abs(risk_score - 0.50) * 2.0), 4)

                # Feature attributions via active n-grams in text
                attributions = self._compute_feature_attributions(text, vec, model, selected_model_id)

            # Determine Risk Category with uncertainty margin
            # High risk threshold default: >= 0.70
            # Low risk threshold default: <= 0.40
            # Intermediate or close to 0.5 boundary: Needs Review
            if risk_score >= high_thresh:
                risk_category = "Higher Risk"
                requires_review = False
            elif risk_score <= low_thresh:
                risk_category = "Lower Risk"
                requires_review = False
            else:
                risk_category = "Needs Review"
                requires_review = True

            # If rule indicators strongly contradict a low ML score, elevate to Needs Review
            if risk_category == "Lower Risk" and rule_analysis.get("total_indicators_count", 0) >= 3:
                risk_category = "Needs Review"
                requires_review = True

        # 5. Tailored Safety Recommendations
        recommendations = self._generate_recommendations(rule_analysis, risk_category, inert_urls)

        return {
            "risk_category": risk_category,
            "risk_score": risk_score,
            "confidence": confidence,
            "model_used": selected_model_id,
            "requires_review": requires_review,
            "abstained": abstained,
            "abstain_reason": abstain_reason,
            "rule_indicators": rule_analysis,
            "feature_attributions": attributions,
            "inert_urls": inert_urls,
            "recommendations": recommendations,
            "safety_disclaimer": "PhishShift provides educational triage decision support and cannot guarantee a message is safe. Always verify unexpected or sensitive requests via known, trusted communication channels."
        }

    def _compute_feature_attributions(self, text: str, vec, model, model_name: str) -> List[Dict[str, Any]]:
        """Identify which words or n-grams present in the message influenced the prediction."""
        try:
            # Get indices of active features in this input
            feature_indices = vec.indices
            if len(feature_indices) == 0:
                return []

            log_reg_model = self.models.get("logistic_regression")
            if log_reg_model and hasattr(log_reg_model, "coef_"):
                coefs = log_reg_model.coef_[0]
                phish_class_idx = list(log_reg_model.classes_).index("phishing")
                sign = 1 if phish_class_idx == 1 else -1

                scored_features = []
                for idx in feature_indices:
                    fname = self.feature_names[idx]
                    weight = float(coefs[idx] * sign)
                    direction = "increases_risk" if weight > 0 else "decreases_risk"
                    scored_features.append({
                        "feature": fname,
                        "weight": round(float(abs(weight)), 4),
                        "direction": direction
                    })

                # Sort by absolute weight impact
                scored_features.sort(key=lambda x: x["weight"], reverse=True)
                return scored_features[:8]
        except Exception as e:
            print(f"Error computing attributions: {e}")
        return []

    def _generate_recommendations(self, rule_analysis: Dict[str, Any], risk_category: str, inert_urls: List[str]) -> List[str]:
        recs = []
        if risk_category == "Higher Risk":
            recs.append("Do not click any defanged links, open attachments, or reply to this message.")
            if rule_analysis.get("credential_indicators"):
                recs.append("Never enter passwords, MFA passcodes, or account tokens on unverified pages.")
            if rule_analysis.get("financial_indicators"):
                recs.append("Independently confirm financial or wire transfer requests via official corporate directory contacts.")
            if inert_urls:
                recs.append(f"Detected {len(inert_urls)} inert link(s). Navigate to services by manually typing the official domain.")
            recs.append("Report this message to your organization's IT Security Operations / Helpdesk.")
        elif risk_category == "Needs Review":
            recs.append("Prediction confidence is moderate or indicators are ambiguous. Manual verification is advised.")
            recs.append("Check the sender's full email address and reply-to domain for spoofing or atypical character substitutions.")
            recs.append("If this email mentions an urgent business deadline, verify directly with your supervisor or the designated department.")
        else:
            recs.append("No overt phishing patterns were detected based on training data.")
            recs.append("Remember: Automated detection cannot guarantee complete safety. Exercise caution if anything seems out of place.")
            recs.append("Ensure your organization's Multi-Factor Authentication (MFA) remains active on all accounts.")

        return recs

    def get_evaluation_reports(self) -> Dict[str, Any]:
        """Load real evaluation metrics from saved reports."""
        eval_path = self.reports_dir / "model_evaluation_report.json"
        pr_path = self.reports_dir / "pr_curve_data.json"
        error_path = self.reports_dir / "error_analysis.json"

        eval_data = {}
        pr_data = {}
        error_data = {}

        if eval_path.exists():
            with open(eval_path, "r", encoding="utf-8") as f:
                eval_data = json.load(f)

        if pr_path.exists():
            with open(pr_path, "r", encoding="utf-8") as f:
                pr_data = json.load(f)

        if error_path.exists():
            with open(error_path, "r", encoding="utf-8") as f:
                error_data = json.load(f)

        return {
            "models_evaluation": eval_data,
            "pr_curves": pr_data,
            "error_analysis": error_data,
            "metadata": self.model_metadata
        }

    def get_robustness_reports(self) -> Dict[str, Any]:
        """Load real robustness test suite results."""
        rob_path = self.reports_dir / "robustness_test_report.json"
        if rob_path.exists():
            with open(rob_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

ml_service = MLService()
