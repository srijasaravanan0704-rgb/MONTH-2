"""
Transparent Rule-Based Baseline Classifier for PhishShift.
Implements documented, interpretable heuristics for phishing detection.
Distinguishes rule indicators from ML feature coefficients.
"""

import re
from typing import Dict, List, Any
import numpy as np

class RuleBasedPhishingClassifier:
    """
    Transparent rule-based baseline that detects specific risk patterns:
    - Urgency & coercion language
    - Credential & auth harvesting requests
    - Financial & wire transfer pressure
    - Suspicious inert URL tokens & unusual TLDs
    - Benign counter-indicators (routine business, appointments, opt-out language)
    """

    URGENCY_PATTERNS = [
        r"\b(urgent|immediately|action required|suspended|locked|within 24 hours|expires|deactivat|unauthorized)\b",
        r"\b(critical|immediate action|final notice|account locked|terminate|disavow)\b"
    ]

    CREDENTIAL_PATTERNS = [
        r"\b(password|re-authenticate|sso|login|verify identity|credentials|mfa|passcode|token|quota exceeded)\b",
        r"\b(sign in|renew certificate|security info|quarantine|reset your)\b"
    ]

    FINANCIAL_PATTERNS = [
        r"\b(wire transfer|direct deposit|invoice #|ach|unclaimed|refund|w-2|withholding|payout|bonus)\b",
        r"\b(btc|bitcoin|wallet|customs fee|redelivery fee|gift card|voucher|overdue)\b"
    ]

    SUSPICIOUS_URL_PATTERNS = [
        r"(hxxps?\[://\][^\s]*\.(tk|ml|top|cc|xyz|club|vip|online|live|fun|site)\b)",
        r"(https?://[^\s]*\.(tk|ml|top|cc|xyz|club|vip|online|live|fun|site)\b)",
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
        r"(hxxps?\[://\][^\s]*(verify|portal|login|auth|cancel|renew|dispute|claim))"
    ]

    BENIGN_COUNTER_PATTERNS = [
        r"\b(reply 1 to confirm|reply stop|dental|walgreens|pharmacy|appointment|uber|doordash|dasher)\b",
        r"\b(sprint planning|architecture review|confluence|pull request|jira\[\.\]internal|canvas\[\.\]university)\b",
        r"\b(flight aa|marriott|bonvoy|your reservation|scheduled maintenance|no user action is required)\b"
    ]

    def __init__(self, high_risk_threshold: float = 0.65, low_risk_threshold: float = 0.35):
        self.high_risk_threshold = high_risk_threshold
        self.low_risk_threshold = low_risk_threshold
        self.name = "Rule-based Baseline"

    def analyze_indicators(self, text: str) -> Dict[str, Any]:
        """Examine text and return activated rule indicators with evidence snippets."""
        lower = text.lower()
        
        urgency_hits = []
        for pat in self.URGENCY_PATTERNS:
            matches = re.findall(pat, lower)
            if matches:
                urgency_hits.extend(matches)
                
        cred_hits = []
        for pat in self.CREDENTIAL_PATTERNS:
            matches = re.findall(pat, lower)
            if matches:
                cred_hits.extend(matches)
                
        financial_hits = []
        for pat in self.FINANCIAL_PATTERNS:
            matches = re.findall(pat, lower)
            if matches:
                financial_hits.extend(matches)
                
        suspicious_url_hits = []
        for pat in self.SUSPICIOUS_URL_PATTERNS:
            matches = re.findall(pat, lower)
            if matches:
                # matches might be tuples
                for m in matches:
                    suspicious_url_hits.append(m if isinstance(m, str) else m[0])

        benign_hits = []
        for pat in self.BENIGN_COUNTER_PATTERNS:
            matches = re.findall(pat, lower)
            if matches:
                benign_hits.extend(matches)

        # Base score calculation: weighted heuristic
        # Urgency: +0.20 per match (max 0.35)
        # Credentials: +0.25 per match (max 0.40)
        # Financial: +0.25 per match (max 0.40)
        # Suspicious URL: +0.35 per match (max 0.50)
        # Benign counter-evidence: -0.35 per match (max -0.60)
        
        raw_score = 0.05
        raw_score += min(len(urgency_hits) * 0.18, 0.35)
        raw_score += min(len(cred_hits) * 0.22, 0.40)
        raw_score += min(len(financial_hits) * 0.22, 0.40)
        raw_score += min(len(suspicious_url_hits) * 0.35, 0.50)
        raw_score -= min(len(benign_hits) * 0.35, 0.60)

        # Clamp between 0.02 and 0.98
        score = float(np.clip(raw_score, 0.02, 0.98))
        
        return {
            "score": round(score, 4),
            "urgency_indicators": list(set(urgency_hits)),
            "credential_indicators": list(set(cred_hits)),
            "financial_indicators": list(set(financial_hits)),
            "suspicious_url_indicators": list(set(suspicious_url_hits)),
            "benign_counter_indicators": list(set(benign_hits)),
            "total_indicators_count": len(urgency_hits) + len(cred_hits) + len(financial_hits) + len(suspicious_url_hits)
        }

    def predict_proba(self, texts: List[str]) -> np.ndarray:
        """Return 2D probability array [[p_benign, p_phish], ...]"""
        probs = []
        for text in texts:
            analysis = self.analyze_indicators(text)
            p_phish = analysis["score"]
            probs.append([1.0 - p_phish, p_phish])
        return np.array(probs)

    def predict(self, texts: List[str]) -> np.ndarray:
        """Return binary prediction labels: 'phishing' or 'benign'."""
        probs = self.predict_proba(texts)[:, 1]
        return np.where(probs >= 0.50, "phishing", "benign")
