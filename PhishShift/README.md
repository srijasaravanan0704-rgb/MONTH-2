# PhishShift: Intelligent Message Risk Scanner

**Project Code:** ML-07  
**Focus Areas:** Cybersecurity, Natural Language Processing (NLP), Machine Learning, Model Explainability, Adversarial Robustness Testing.

---

## 1. Project Overview

**PhishShift** is an enterprise-grade, intermediate-to-advanced cybersecurity web application that analyzes inbound Email and SMS communications, estimates threat probability, provides transparent word-level explainability, and recommends prescriptive safety actions.

Unlike static demo dashboards, PhishShift is powered by **genuine, reproducible scikit-learn models**, calibrated probability estimation via Platt scaling, zero-leakage campaign holdout partitioning, and a controlled adversarial robustness test suite.

```
       [ Inbound Email / SMS Message ]
                      │
                      ▼
       [ Preprocessing & Defanger ]  ──► (All URLs inert: hxxps[://]domain[.]tld)
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
[ Statistical ML Model ]   [ Rule Heuristics Engine ]
(Calibrated Linear SVM)    (Urgency, Credentials, Wire, TLDs)
           │                     │
           └──────────┬──────────┘
                      ▼
       [ Transparent Decision Layer ]
  (High Risk ≥ 0.70  │  Needs Review  │  Lower Risk ≤ 0.40)
                      │
                      ▼
[ Word-Level Explainability & Safety Prescriptions ]
```

---

## 2. Key Architecture & Features

- **Genuine Machine Learning Pipelines**:
  1. **Transparent Rule-Based Baseline**: Transparent pattern matching across urgency, credential triggers, wire fraud, and suspicious inert TLDs.
  2. **TF-IDF + Logistic Regression**: L2-regularized linear classifier with native log-odds probability calibration.
  3. **TF-IDF + Linear SVM (Production Model)**: Maximum-margin hyperplane calibrated with Platt sigmoid scaling (`CalibratedClassifierCV`) to output true posterior probabilities.
  4. **Multinomial Naive Bayes**: Probabilistic baseline with Dirichlet smoothing.
- **Explainability & Attribution Engine**:
  - Word-level feature weights showing which n-grams increased vs decreased the risk score.
  - Itemized heuristic breakdown highlighting detected urgency terms, credential harvesting keywords, and wire fraud triggers.
- **Zero-Leakage Campaign Holdout Partitioning**:
  - 105 messages across 4 distinct campaigns were withheld entirely from training and parameter tuning to evaluate true out-of-sample generalization.
- **Advanced Robustness Testing**:
  - Controlled perturbation suite evaluating 8 variations: punctuation noise, erratic casing, whitespace token evasion (`p a s s w o r d`), leetspeak, formal synonyms, and legitimate urgent corporate alerts.
- **Privacy-Preserving Audit Trail**:
  - Minimal necessary storage default: stores only 180-character previews in SQLite. Full body storage is strictly opt-in.
  - One-click CSV export and database clearing controls.
- **Modern Cybersecurity SaaS Dashboard**:
  - Responsive layout with dark navy sidebar (`#0F172A`), teal/cyan accents, and accessible risk badges (Red / Amber / Green).
  - Interactive Recharts donut charts and Precision-Recall tradeoff curves.
  - 1-Click educational sample presets for rapid demonstration.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons, Recharts, React Router v7.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy, SQLite, Uvicorn.
- **Machine Learning**: scikit-learn, pandas, NumPy, joblib, RapidFuzz.
- **Testing**: pytest, pytest-asyncio, httpx TestClient.

---

## 4. Quick Start Guide (Windows PowerShell / VS Code)

### Prerequisites
- Python 3.10+ (Tested on Python 3.12.10)
- Node.js 18+ (Tested on Node.js v24.21.0, npm 11.19.0)

### Step 1: Open Terminal in Project Root
```powershell
cd c:\Users\srija\OneDrive\Desktop\phishshift
```

### Step 2: Set Up Backend & Install Dependencies
```powershell
# Optional: Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r backend/requirements.txt
```

### Step 3: Reproduce Data Pipeline & Model Training
```powershell
# 1. Generate 492-sample raw educational dataset
python data/generate_dataset.py

# 2. Run deduplication and campaign-separated holdout splitting
python ml/preprocess.py

# 3. Train all 4 models and save artifacts
python ml/train.py

# 4. Run holdout evaluation, PR curves, and error analysis
python ml/evaluate.py

# 5. Run the 8-point adversarial robustness test suite
python ml/robustness.py
```

### Step 4: Run Automated Test Suite
```powershell
# Run all 21 unit and integration tests
python -m pytest backend/tests/ -v
```
*(All 21 tests pass 100%).*

### Step 5: Start Backend API Server
In a PowerShell terminal:
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health: `http://127.0.0.1:8000/api/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### Step 6: Start Frontend Application
In a second PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open **`http://127.0.0.1:5173`** in your browser.

---

## 5. Project Directory Structure

```
phishshift/
  backend/
    app/
      api/endpoints.py        # REST routes (scan, history, metrics, settings)
      core/config.py          # App settings & threshold configurations
      database/models.py      # SQLAlchemy SQLite schemas (ScanRecord, UserSettings)
      database/session.py     # Database engine & session generator
      schemas/scan.py         # Pydantic v2 validation models
      services/ml_service.py  # Model loader, Platt calibration & explainability
      services/scan_service.py# Privacy-conscious scan persistence & CSV export
      main.py                 # FastAPI application entry point
    tests/
      test_preprocessing_and_leakage.py    # Deduplication & zero-leakage tests
      test_models_and_inference.py         # Inference, attributions, abstention
      test_false_positives_and_robustness.py # Password reset false positive stress
      test_api_endpoints.py                # Full REST API TestClient suite
    requirements.txt
    .env.example
  frontend/
    src/
      components/ScanDetailModal.jsx # Deep-dive forensic review modal
      context/ThemeContext.jsx       # Light/Dark mode state manager
      context/ToastContext.jsx       # Alert notification provider
      layouts/MainLayout.jsx         # Responsive sidebar & header navigation
      pages/
        Dashboard.jsx                # Telemetry, KPI cards & Recharts distribution
        Scanner.jsx                  # Email/SMS triage scanner & explainability
        History.jsx                  # Searchable audit history with CSV export
        ModelInsights.jsx            # Benchmarks, PR curves & robustness suite
        Settings.jsx                 # Threshold calibration & privacy settings
      services/api.js                # API reverse proxy client
      App.jsx                        # React Router application root
      index.css                      # Tailwind v4 styles & theme tokens
    package.json
    vite.config.js
  data/
    raw/dataset_raw.csv              # Raw multi-campaign records
    processed/                       # Clean train, val, and campaign_holdout CSVs
    generate_dataset.py              # Reproducible dataset pipeline
    README.md
  ml/
    rule_baseline.py                 # Transparent rule-based classifier
    train.py                         # Scikit-learn training & Platt calibration
    evaluate.py                      # PR curves, holdout metrics & error analysis
    robustness.py                    # Adversarial perturbation test harness
    artifacts/                       # Persisted joblib models & feature names
    reports/                         # Real JSON evaluation reports
  docs/
    architecture.md                  # System design & pipeline diagrams
    dataset_provenance.md            # Data sources, licensing & schema
    requirements_traceability.md     # Requirement-to-test verification matrix
  README.md
  .gitignore
```

---

## 6. Model Evaluation Results Summary

Results on the **Campaign-Separated Holdout Set** (105 completely unseen messages):

| Model | Accuracy | Precision | Recall | F1-Score | False Positive Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Rule-Based Baseline** | 68.6% | 100.0% | 28.3% | 0.4407 | 0.0% |
| **TF-IDF Logistic Regression** | 61.9% | 53.5% | 100.0% | 0.6970 | 67.8% |
| **TF-IDF Linear SVM (Production)** | **81.0%** | **73.2%** | **89.1%** | **0.8039** | **25.4%** |
| **Multinomial Naive Bayes** | 76.2% | 64.8% | 100.0% | 0.7863 | 42.4% |

*Notice: Linear SVM provides the most balanced F1-score and generalization accuracy on held-out campaigns.*

---

## 7. Three-to-Five Minute Demonstration Workflow

Follow this concise sequence to demonstrate all major features during evaluation:

1. **Dashboard & Telemetry Overview (1 min)**:
   - Navigate to `http://127.0.0.1:5173`.
   - Show the KPI cards displaying Total Scans, High Risk, Needs Review, and Lower Risk messages.
   - Point out the interactive Recharts Risk Distribution donut chart and recent scans feed.
   - Highlight the prominent **Decision Support Disclaimer** reminding users that automated triage is not an absolute security guarantee.

2. **Message Scanner & Phishing Detection (1 min)**:
   - Click **Message Scanner** in the sidebar.
   - Click the preset sample button: **"M365 Urgent Password Expiration"**.
   - Click **"Analyze Message"**.
   - Show the **Higher Risk** red banner with **99.8% probability**.
   - Walk through the **Feature Attribution bars**: explain how words like `expires`, `verify`, `password` strongly increased the threat score.
   - Inspect the **Detected Heuristic Clues** showing urgency language and inert defanged link tokens.

3. **False-Positive Resistance Demonstration (1 min)**:
   - In the Scanner, click the preset sample: **"Legitimate Password Reset (Google)"**.
   - Point out that this message legitimately contains the words `password`, `reset`, `expire in 15 minutes`.
   - Click **"Analyze Message"**.
   - Show that the ML model evaluates it as **Low Risk (4.8%)** and the system flags it as **Needs Review** rather than triggering a false alarm, proving robustness against business password alerts.
   - Next, test **"USPS Smishing Delivery Redirection"** under SMS mode to demonstrate smishing analysis.

4. **Audit History & Privacy Controls (45 sec)**:
   - Click **Scan History** in the sidebar.
   - Demonstrate the search bar and channel/risk filters.
   - Click on any scan row to display the **Scan Assessment Details Modal**.
   - Point out the privacy note: body contents are stored as truncated previews by default unless full retention is chosen.
   - Click **"Export CSV"** to demonstrate downloadable reporting.

5. **Model Insights & Robustness Suite (45 sec)**:
   - Click **Model Insights** in the sidebar.
   - Show the **Validation Benchmark Comparison** table.
   - Switch to the **Campaign Holdout & PR Curves** tab to show the Precision-Recall curves.
   - Switch to the **Adversarial Robustness Suite** tab: walk through the 8 controlled variations (whitespace token splitting, leetspeak, punctuation noise) showing that predictions remained robust without flipping.
   - Switch to the **False Positive Error Analysis** tab to review the documented root causes.
   - Visit **Settings** to demonstrate the Dark/Light theme toggle and threshold sliders.

---

## 8. Educational Use & Limitations Disclaimer

**PhishShift is developed for educational risk assessment and triage decision support.**
- Low predicted risk does **not** prove that a message is completely safe.
- Automated statistical classifiers cannot guarantee immunity against novel, zero-day spear-phishing campaigns or compromised legitimate accounts.
- Always verify sensitive financial transactions, banking instructions, and password resets through independent, out-of-band communication channels.
