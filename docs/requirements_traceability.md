# PhishShift: Requirements Traceability Matrix

This document maps all prompt specifications (Functional, Machine Learning, Cybersecurity, Architecture, and Testing) directly to the implementing code files and verified automated tests.

---

| Requirement ID | Prompt Specification | Implementing Module | Verification & Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Support at least 400 labeled message examples with required schema fields. | `data/generate_dataset.py`, `data/raw/dataset_raw.csv` | `ml/preprocess.py` (Outputs 408 clean samples with 10 fields) | **VERIFIED** |
| **REQ-02** | Zero URL execution; defang all links as inert text (`hxxps[://]`). | `ml/preprocess.py`, `app/services/ml_service.py` | `backend/tests/test_preprocessing_and_leakage.py::test_url_defanging` | **VERIFIED** |
| **REQ-03** | Exact and near-duplicate template identification and removal. | `ml/preprocess.py::remove_exact_and_near_duplicates` | `backend/tests/test_preprocessing_and_leakage.py::test_exact_and_near_duplicate_removal` | **VERIFIED** |
| **REQ-04** | Campaign-separated holdout splitting with zero leakage. | `ml/preprocess.py::partition_campaign_holdout` | `backend/tests/test_preprocessing_and_leakage.py::test_campaign_leakage_prevention` | **VERIFIED** |
| **REQ-05** | Implement 3 genuine models: Rule Baseline, TF-IDF Logistic Regression, TF-IDF Linear SVM, and Naive Bayes. | `ml/train.py`, `ml/rule_baseline.py` | `ml/evaluate.py`, `backend/tests/test_models_and_inference.py::test_ml_service_artifacts_loaded` | **VERIFIED** |
| **REQ-06** | Reliable probability calibration via Platt scaling on Linear SVM. | `ml/train.py` (`CalibratedClassifierCV`) | `ml/evaluate.py`, `backend/tests/test_models_and_inference.py::test_phishing_message_detection` | **VERIFIED** |
| **REQ-07** | Dual explainability layer: distinguish model feature weights from rule evidence. | `app/services/ml_service.py`, `Scanner.jsx` | `backend/tests/test_models_and_inference.py::test_explainability_feature_attributions` | **VERIFIED** |
| **REQ-08** | Configurable decision thresholds with "Needs Review" category. | `app/services/ml_service.py`, `Settings.jsx` | `backend/tests/test_api_endpoints.py::test_settings_validation_and_update` | **VERIFIED** |
| **REQ-09** | Model abstention on out-of-scope, empty, or short inputs. | `app/services/ml_service.py::check_abstention` | `backend/tests/test_models_and_inference.py::test_model_abstention_on_empty_or_short_input` | **VERIFIED** |
| **REQ-10** | False-positive resistance on legitimate password resets & payroll notices. | `ml/train.py`, `app/services/ml_service.py` | `backend/tests/test_false_positives_and_robustness.py::test_legitimate_password_reset_false_positive_resistance` | **VERIFIED** |
| **REQ-11** | Controlled Adversarial Robustness Suite with at least 8 harmless variations. | `ml/robustness.py` | `backend/tests/test_false_positives_and_robustness.py::test_robustness_against_casing_and_punctuation_noise` | **VERIFIED** |
| **REQ-12** | Privacy-conscious scan history storage (body preview default, opt-in full body). | `app/services/scan_service.py`, `app/database/models.py` | `backend/tests/test_api_endpoints.py::test_scan_history_workflow` | **VERIFIED** |
| **REQ-13** | CSV Export and individual/bulk deletion for audit history. | `app/api/endpoints.py`, `History.jsx` | `backend/tests/test_api_endpoints.py::test_csv_export_endpoint` | **VERIFIED** |
| **REQ-14** | Complete REST API endpoints (`/api/health`, `/api/scan`, `/api/scans`, etc.). | `app/api/endpoints.py` | `backend/tests/test_api_endpoints.py::test_health_check_endpoint` and full suite | **VERIFIED** |
| **REQ-15** | Modern, responsive Cybersecurity SaaS UI with dark navy theme & Recharts. | `frontend/src/` (`MainLayout`, `Dashboard`, `Scanner`, `History`, `ModelInsights`, `Settings`) | Verified via `npm run build` and browser subagent E2E test | **VERIFIED** |
| **REQ-16** | Explicit decision support disclaimers & limitations notice. | `app/services/ml_service.py`, `Dashboard.jsx`, `Scanner.jsx` | UI banner & API schema verification | **VERIFIED** |

---

### Summary of Test Execution
All 21 automated backend tests pass with 100% compliance:
```
backend/tests/test_api_endpoints.py               11 PASSED
backend/tests/test_false_positives_and_robustness.py 3 PASSED
backend/tests/test_models_and_inference.py        4 PASSED
backend/tests/test_preprocessing_and_leakage.py    3 PASSED
Total: 21 PASSED in 3.66s
```
