"""
Tests for FastAPI Endpoints using TestClient.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True

def test_dashboard_summary_endpoint():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_scans" in data
    assert "risk_distribution" in data
    assert "model_performance_summary" in data

def test_scan_message_success():
    payload = {
        "channel": "email",
        "subject": "Action Required: Re-authenticate Microsoft 365 Account",
        "body": "Your email storage is full. Please re-authenticate your mailbox at hxxps[://]portal-verify[.]net",
        "store_body": False
    }
    res = client.post("/api/scan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "scan_id" in data
    assert data["risk_category"] in ["Higher Risk", "Needs Review", "Lower Risk"]
    assert "safety_disclaimer" in data
    assert "rule_indicators" in data
    assert "feature_attributions" in data

def test_scan_invalid_empty_body():
    payload = {
        "channel": "email",
        "body": "  "
    }
    res = client.post("/api/scan", json=payload)
    assert res.status_code == 422

def test_scan_invalid_channel():
    payload = {
        "channel": "carrier_pigeon",
        "body": "Legitimate text body message"
    }
    res = client.post("/api/scan", json=payload)
    assert res.status_code == 422

def test_scan_history_workflow():
    # 1. Scan a sample message
    scan_res = client.post("/api/scan", json={
        "channel": "sms",
        "body": "USPS: Your package is on hold. Clear delivery fee at hxxps[://]usps-redelivery[.]info",
        "store_body": True
    })
    assert scan_res.status_code == 200
    scan_id = scan_res.json()["scan_id"]

    # 2. Get history list
    list_res = client.get("/api/scans?page=1&limit=5")
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(item["id"] == scan_id for item in items)

    # 3. Get single scan detail
    detail_res = client.get(f"/api/scans/{scan_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["scan_id"] == scan_id
    assert detail["stored_full_body"] is True

    # 4. Delete the scan
    del_res = client.delete(f"/api/scans/{scan_id}")
    assert del_res.status_code == 200

    # 5. Verify deletion
    verify_res = client.get(f"/api/scans/{scan_id}")
    assert verify_res.status_code == 404

def test_csv_export_endpoint():
    res = client.get("/api/scans/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "scan_id" in res.text

def test_models_and_metrics_endpoints():
    res_models = client.get("/api/models")
    assert res_models.status_code == 200
    assert len(res_models.json()) >= 3

    res_metrics = client.get("/api/models/metrics")
    assert res_metrics.status_code == 200
    assert "models_evaluation" in res_metrics.json()

def test_robustness_results_endpoint():
    res = client.get("/api/robustness/results")
    assert res.status_code == 200
    data = res.json()
    assert "test_results" in data
    assert len(data["test_results"]) >= 8

def test_settings_validation_and_update():
    # Test invalid thresholds where low >= high (0.50 >= 0.50)
    invalid_payload = {
        "high_risk_threshold": 0.50,
        "low_risk_threshold": 0.50
    }
    res = client.post("/api/settings", json=invalid_payload)
    assert res.status_code == 400

    # Test valid update
    valid_payload = {
        "high_risk_threshold": 0.75,
        "low_risk_threshold": 0.35,
        "store_message_body_default": False
    }
    res_valid = client.post("/api/settings", json=valid_payload)
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["high_risk_threshold"] == 0.75
    assert data["low_risk_threshold"] == 0.35

def test_educational_samples_endpoint():
    res = client.get("/api/samples")
    assert res.status_code == 200
    samples = res.json()
    assert len(samples) >= 5
    assert any(s["category"] == "phishing" for s in samples)
    assert any(s["category"] == "benign" for s in samples)
