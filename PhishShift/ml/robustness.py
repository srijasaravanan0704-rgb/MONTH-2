"""
Advanced Robustness Testing Module for PhishShift.
Evaluates controlled, harmless text perturbations:
- Punctuation and casing noise
- Leetspeak and character substitution
- Whitespace injection / evasion tactics
- Unfamiliar synonym variations
- Inert URL format variations
- Legitimate urgent notices (passwords, payroll, HR) to test False Positive resilience
Measures score shifts, flip rates, and generates detailed test report.
"""

import json
import os
import re
import sys

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import joblib
import numpy as np

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")

# Controlled harmless perturbation functions
def perturb_punctuation(text: str) -> str:
    """Inject unusual punctuation noise and emphasis."""
    t = text.replace(".", "..!!").replace("!", "!!???")
    return t.replace(":", " : ")

def perturb_capitalization(text: str) -> str:
    """Simulate alternating casing or erratic uppercase emphasis."""
    words = text.split()
    perturbed = [w.upper() if i % 3 == 0 else w.lower() for i, w in enumerate(words)]
    return " ".join(perturbed)

def perturb_whitespace(text: str) -> str:
    """Simulate spacing evasion around critical tokens."""
    t = re.sub(r"(?i)\bpassword\b", "p a s s w o r d", text)
    t = re.sub(r"(?i)\blogin\b", "l o g i n", t)
    t = re.sub(r"(?i)\bverify\b", "v e r i f y", t)
    return t

def perturb_leetspeak(text: str) -> str:
    """Simulate harmless character substitutions (e.g., @ for a, 0 for o)."""
    table = str.maketrans({"a": "@", "o": "0", "e": "3", "i": "1", "s": "$"})
    return text.translate(table)

def perturb_url_formatting(text: str) -> str:
    """Vary defanging representation from hxxps[://] to [dot] / (dot)."""
    t = text.replace("[.]", "(dot)")
    t = t.replace("hxxps[://]", "hxxps://")
    return t

def perturb_synonyms(text: str) -> str:
    """Replace common phishing triggers with formal or unfamiliar synonyms."""
    replacements = {
        r"(?i)\burgent\b": "time-critical",
        r"(?i)\bimmediately\b": "promptly without delay",
        r"(?i)\bpassword\b": "access credential passcode",
        r"(?i)\bverify\b": "re-validate authenticity of",
        r"(?i)\bsuspended\b": "temporarily placed on hold",
        r"(?i)\bclick here\b": "navigate to the designated portal"
    }
    t = text
    for pat, rep in replacements.items():
        t = re.sub(pat, rep, t)
    return t

# 8 Benchmark Showcase Variations (controlled, reproducible)
SHOWCASE_VARIATIONS = [
    {
        "id": "VAR-01",
        "variation_type": "Punctuation & Syntax Noise",
        "original_label": "phishing",
        "original_text": "CRITICAL: Your Microsoft 365 Password Expires in 24 Hours. Verify now: hxxps[://]login-microsoft365-verify[.]net/auth",
        "transform": perturb_punctuation,
        "description": "Simulates threat actor using excessive exclamation marks, duplicate periods, and odd spacing."
    },
    {
        "id": "VAR-02",
        "variation_type": "Erratic Capitalization",
        "original_label": "phishing",
        "original_text": "Action Required: Re-authenticate your Office 365 mailbox to avoid permanent account deactivation.",
        "transform": perturb_capitalization,
        "description": "Simulates erratic word-level casing designed to bypass naive case-sensitive keyword filters."
    },
    {
        "id": "VAR-03",
        "variation_type": "Whitespace Token Evasion",
        "original_label": "phishing",
        "original_text": "Your corporate account password has expired. Please verify your credentials immediately to avoid suspension.",
        "transform": perturb_whitespace,
        "description": "Inserts spacing into high-signal tokens ('p a s s w o r d', 'v e r i f y') to evade standard n-gram tokenization."
    },
    {
        "id": "VAR-04",
        "variation_type": "Controlled Leetspeak Obfuscation",
        "original_label": "phishing",
        "original_text": "Security Alert: Unusual sign-in activity detected on your bank account. Settle verification at hxxps[://]bank-portal[.]cc",
        "transform": perturb_leetspeak,
        "description": "Applies standard substitution (@, 0, 3, $) to evaluate character-level sensitivity."
    },
    {
        "id": "VAR-05",
        "variation_type": "Alternative Inert URL Formatting",
        "original_label": "phishing",
        "original_text": "USPS Alert: Package on hold due to missing address. Resolve at hxxps[://]usps-redelivery[.]info/track",
        "transform": perturb_url_formatting,
        "description": "Replaces [.] with (dot) and tests alternative defanged link syntax."
    },
    {
        "id": "VAR-06",
        "variation_type": "Formal Synonym Substitution",
        "original_label": "phishing",
        "original_text": "Urgent: Click here to verify your password immediately or account will be suspended within 24 hours.",
        "transform": perturb_synonyms,
        "description": "Replaces high-frequency training tokens with formal synonyms ('time-critical', 're-validate', 'promptly without delay')."
    },
    {
        "id": "VAR-07",
        "variation_type": "Legitimate Urgent Password Reset (False Positive Stress)",
        "original_label": "benign",
        "original_text": "Hi Alex,\n\nWe received a request to reset your password for your corporate Google Workspace account. This link will expire in 15 minutes: hxxps[://]accounts[.]google[.]com/signin/recovery\n\nIf you did not request this, you can safely ignore this email.\n\nGoogle Workspace Team",
        "transform": lambda t: t,  # Pure authentic test
        "description": "Evaluates whether the model falsely classifies legitimate automated password recovery notices as phishing."
    },
    {
        "id": "VAR-08",
        "variation_type": "Legitimate Urgent Payroll & Tax Deadline (False Positive Stress)",
        "original_label": "benign",
        "original_text": "URGENT ACTION REQUIRED FOR ALL EMPLOYEES: Friday at 5:00 PM is the strict deadline to review your updated W-4 federal tax withholdings and confirm your direct deposit routing information on ADP Workforce Now.\n\nVisit: hxxps[://]workforcenow[.]adp[.]com\n\nPayroll & HR Shared Services",
        "transform": lambda t: t,
        "description": "Contains heavy urgency and payroll keywords, testing the model's ability to resist false alarm on benign administrative alerts."
    }
]

def run_robustness_evaluation():
    os.makedirs(REPORTS_DIR, exist_ok=True)

    vectorizer = joblib.load(os.path.join(ARTIFACTS_DIR, "tfidf_vectorizer.joblib"))
    linear_svm = joblib.load(os.path.join(ARTIFACTS_DIR, "linear_svm.joblib"))
    rule_model = joblib.load(os.path.join(ARTIFACTS_DIR, "rule_baseline.joblib"))

    results = []
    flips_count = 0
    total_delta = 0.0

    for item in SHOWCASE_VARIATIONS:
        orig_text = item["original_text"]
        perturbed_text = item["transform"](orig_text)

        # Baseline inference
        orig_vec = vectorizer.transform([orig_text])
        orig_prob = float(linear_svm.predict_proba(orig_vec)[0, 1])
        orig_pred = "phishing" if orig_prob >= 0.50 else "benign"

        # Perturbed inference
        pert_vec = vectorizer.transform([perturbed_text])
        pert_prob = float(linear_svm.predict_proba(pert_vec)[0, 1])
        pert_pred = "phishing" if pert_prob >= 0.50 else "benign"

        # Rule baseline assessment
        orig_rule = rule_model.analyze_indicators(orig_text)
        pert_rule = rule_model.analyze_indicators(perturbed_text)

        prob_delta = round(pert_prob - orig_prob, 4)
        total_delta += abs(prob_delta)
        category_flipped = (orig_pred != pert_pred)
        if category_flipped:
            flips_count += 1

        # Determine robustness outcome
        if item["original_label"] == "benign":
            # Target is benign
            if pert_pred == "benign":
                outcome = "PASSED_BENIGN_RESILIENCE"
                outcome_notes = "Correctly remained classified as benign despite urgent/credential keyword pressure."
            else:
                outcome = "FALSE_POSITIVE_VULNERABILITY"
                outcome_notes = "Model was misled by legitimate urgency tokens into an unwarranted phishing prediction."
        else:
            # Target is phishing
            if pert_pred == "phishing":
                outcome = "ROBUST_AGAINST_EVASION"
                outcome_notes = "Retained high-risk phishing classification despite obfuscation or noise."
            else:
                outcome = "EVASION_SUCCESSFUL"
                outcome_notes = f"Perturbation reduced model confidence by {abs(prob_delta)*100:.1f}%, causing misclassification."

        results.append({
            "id": item["id"],
            "variation_type": item["variation_type"],
            "description": item["description"],
            "original_label": item["original_label"],
            "original_snippet": orig_text[:140] + "...",
            "perturbed_snippet": perturbed_text[:140] + "...",
            "original_risk_score": round(orig_prob, 4),
            "perturbed_risk_score": round(pert_prob, 4),
            "score_shift_delta": prob_delta,
            "original_prediction": orig_pred,
            "perturbed_prediction": pert_pred,
            "prediction_flipped": category_flipped,
            "rule_indicators_detected": pert_rule["total_indicators_count"],
            "robustness_outcome": outcome,
            "outcome_notes": outcome_notes
        })

    report = {
        "evaluation_name": "PhishShift Controlled Adversarial & Perturbation Robustness Suite",
        "evaluated_model": "TF-IDF Linear SVM (Calibrated)",
        "test_cases_evaluated": len(SHOWCASE_VARIATIONS),
        "flipped_predictions_count": flips_count,
        "flip_rate": round(flips_count / len(SHOWCASE_VARIATIONS), 4),
        "mean_absolute_score_shift": round(total_delta / len(SHOWCASE_VARIATIONS), 4),
        "test_results": results,
        "recommendations": [
            "Combine character-level n-grams or subword tokenization to mitigate whitespace token splitting (VAR-03).",
            "Maintain an explicit benign corporate notification context filter to reduce false positives on administrative deadlines (VAR-08).",
            "Use the 'Needs Review' abstain threshold when prediction confidence sits between 0.40 and 0.65."
        ]
    }

    with open(os.path.join(REPORTS_DIR, "robustness_test_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("Robustness evaluation finished.")
    print(f"Total tests: {len(SHOWCASE_VARIATIONS)} | Flipped: {flips_count} | Mean Shift: {report['mean_absolute_score_shift']}")
    for res in results:
        status_symbol = "PASS" if "ROBUST" in res["robustness_outcome"] or "PASSED" in res["robustness_outcome"] else "WARN"
        print(f"  [{status_symbol}] {res['id']} - {res['variation_type']}: {res['original_risk_score']} -> {res['perturbed_risk_score']} ({res['robustness_outcome']})")

if __name__ == "__main__":
    run_robustness_evaluation()
