import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app.main import app

client = TestClient(app)

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

def test_predict_endpoint_empty_input():
    payload = {
        "subject": "   ",
        "body": "  "
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 400

def test_model_info_endpoint():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_loaded"] is True
    assert "accuracy" in data
    assert "precision" in data
    assert "f1_score" in data
    assert "confusion_matrix" in data
