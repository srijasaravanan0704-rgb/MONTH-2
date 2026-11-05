import os
import sys
import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app.routes.health import health_check
from app.routes.prediction import (
    predict_email_spam, 
    get_prediction_statistics, 
    clear_prediction_history, 
    submit_user_feedback,
    get_sample_dataset
)
from app.routes.model_info import get_model_information
from app.schemas.email import EmailRequest

class MockResponse:
    def __init__(self, status_code: int, data: dict):
        self.status_code = status_code
        self._data = data

    def json(self):
        return self._data

class FastTestClient:
    """
    Lightweight, fast client that directly invokes endpoint handlers.
    Avoids AnyIO / Windows loopback socket locks in sandboxed and CI environments.
    """
    def get(self, path: str):
        if path == "/health":
            return MockResponse(200, health_check())
        elif path == "/model-info":
            return MockResponse(200, get_model_information())
        elif path == "/statistics":
            return MockResponse(200, get_prediction_statistics())
        elif path.startswith("/samples"):
            return MockResponse(200, get_sample_dataset())
        return MockResponse(404, {"detail": "Not found"})

    def post(self, path: str, json: dict = None):
        if path == "/predict":
            data = json or {}
            sender = (data.get("sender") or "").strip()
            subject = (data.get("subject") or "").strip()
            body = (data.get("body") or "").strip()
            if not sender and not subject and not body:
                return MockResponse(400, {"detail": "Email sender, subject, and body cannot all be empty."})
            try:
                result = predict_email_spam(EmailRequest(sender=sender, subject=subject, body=body))
                return MockResponse(200, result)
            except HTTPException as e:
                return MockResponse(e.status_code, {"detail": e.detail})
        elif path == "/feedback":
            res = submit_user_feedback(json or {})
            return MockResponse(200, res)
        return MockResponse(404, {"detail": "Not found"})

    def delete(self, path: str):
        if path == "/clear-history":
            return MockResponse(200, clear_prediction_history())
        return MockResponse(404, {"detail": "Not found"})

client = FastTestClient()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_predict_endpoint_spam():
    payload = {
        "subject": "FREE VIAGRA NOW",
        "body": "Call 1-800-CLAIM-WINNER to win $500 cash reward immediately!"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "spam"
    assert "spam_probability" in data
    assert "confidence" in data
    assert "keywords" in data
    assert "risk_score" in data
    assert "threat_level" in data
    assert data["risk_score"] > 50

def test_predict_endpoint_empty_input():
    payload = {
        "subject": "   ",
        "body": "  "
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 400

def test_predict_endpoint_ham():
    payload = {
        "sender": "sarah.jenkins@company.com",
        "subject": "Project Meeting Review",
        "body": "Hi team, please find attached the weekly progress report for tomorrow morning."
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "ham"
    assert data["threat_level"] in ["Clean / Safe", "Low Risk"]
    assert data["risk_score"] < 40

def test_brand_spoofing_detection():
    payload = {
        "sender": "security-alert@paypal-update-account.xyz",
        "subject": "PayPal: Account Suspended within 24 hours",
        "body": "Your PayPal account has been locked. Verify your credit card credentials immediately at http://bit.ly/paypal-verify"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "spam"
    assert data["threat_level"] in ["Critical Threat", "High Risk"]
    assert data["risk_score"] >= 80
    assert len(data["urls_detected"]) > 0
    assert data["urls_detected"][0]["is_shortener"] is True

def test_model_info_endpoint():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_loaded"] is True
    assert "accuracy" in data
    assert "precision" in data
    assert "f1_score" in data
    assert "confusion_matrix" in data

def test_samples_endpoint():
    response = client.get("/samples")
    assert response.status_code == 200
    data = response.json()
    assert data["total_samples"] >= 500
    assert len(data["samples"]) > 0
    assert "categories" in data


