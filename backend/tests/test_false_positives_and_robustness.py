"""
Tests for False Positive Resistance and Robustness under Harmless Variations.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.services.ml_service import ml_service

def test_legitimate_password_reset_false_positive_resistance():
    """Legitimate automated Google Workspace password recovery must not be falsely categorized as Higher Risk."""
    benign_reset = (
        "Hi Alex,\n\nWe received a request to reset your password for your corporate Google Workspace account. "
        "If you made this request, please use the following link to choose a new password: "
        "hxxps[://]accounts[.]google[.]com/signin/recovery\n\n"
        "This link is valid for 15 minutes. If you did not request this, you can safely ignore this email; "
        "your password will remain unchanged.\n\nGoogle Workspace Team"
    )
    result = ml_service.analyze_message(benign_reset, channel="email", model_name="linear_svm")

    assert result["risk_category"] != "Higher Risk", f"False positive occurred: classified as {result['risk_category']} with score {result['risk_score']}"
    assert result["risk_score"] < 0.50

def test_legitimate_payroll_statement_resistance():
    """Routine bi-weekly ADP earnings statement must not trigger high risk phishing alarm."""
    benign_payroll = (
        "Dear Team Member,\n\nYour bi-weekly direct deposit earnings statement for pay period ending October 15, 2026 "
        "is now available. Log in to your ADP Workforce Now account to review pay and tax withholdings: "
        "hxxps[://]workforcenow[.]adp[.]com\n\nPlease reach out to payroll@company.internal if you have any questions.\n\n"
        "Payroll & HR Shared Services"
    )
    result = ml_service.analyze_message(benign_payroll, channel="email", model_name="linear_svm")

    assert result["risk_category"] != "Higher Risk"

def test_robustness_against_casing_and_punctuation_noise():
    """Phishing intent should still be recognized under erratic casing and punctuation."""
    perturbed_phish = "CRITICAL: !! Your MICROSOFT 365 Password EXPIRES in 24 Hours...!! Verify : hxxps[://]login-verify[.]net/auth"
    result = ml_service.analyze_message(perturbed_phish, channel="email", model_name="linear_svm")

    assert result["risk_category"] == "Higher Risk"
