"""
Tests for ML Model Inference, Explainability, and Abstention Logic.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.services.ml_service import ml_service

def test_ml_service_artifacts_loaded():
    assert ml_service.is_loaded is True
    assert "linear_svm" in ml_service.models
    assert "logistic_regression" in ml_service.models
    assert "rule_baseline" in ml_service.models
    assert len(ml_service.feature_names) > 0

def test_phishing_message_detection():
    phish_text = "CRITICAL: Your Microsoft 365 Password Expires in 24 Hours. Verify now at hxxps[://]login-verify[.]net"
    result = ml_service.analyze_message(phish_text, channel="email", model_name="linear_svm")

    assert result["risk_category"] == "Higher Risk"
    assert result["risk_score"] >= 0.70
    assert result["abstained"] is False
    assert len(result["recommendations"]) > 0
    assert len(result["inert_urls"]) > 0

def test_model_abstention_on_empty_or_short_input():
    short_text = "hi"
    result = ml_service.analyze_message(short_text, channel="email")

    assert result["abstained"] is True
    assert result["requires_review"] is True
    assert result["risk_category"] == "Needs Review"
    assert "insufficient context" in result["abstain_reason"].lower()

def test_explainability_feature_attributions():
    msg = "Urgent: Update your direct deposit banking information immediately to avoid payment delay."
    result = ml_service.analyze_message(msg, channel="email", model_name="logistic_regression")

    assert "feature_attributions" in result
    attributions = result["feature_attributions"]
    assert len(attributions) > 0
    # Verify top features contain relevant tokens
    features = [a["feature"] for a in attributions]
    assert any(w in " ".join(features) for w in ["deposit", "direct", "urgent", "banking", "payment", "information"])
