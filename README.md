# MONTH-2 Projects Repository

Welcome to the **MONTH-2** engineering and machine learning repository. This repository hosts two production-grade full-stack artificial intelligence and machine learning applications, each isolated into its own self-contained directory.

---

## 📁 Repository Structure

```
MONTH-2/
│
├── OptiMach-AI/                 # Industrial Predictive Maintenance Platform
│   ├── backend/                 # FastAPI ML inference & telemetry service
│   ├── frontend/                # React 18, Three.js 3D Factory Twin & Tailwind CSS
│   ├── requirements.txt         # Backend Python dependencies
│   └── README.md                # Dedicated OptiMach AI documentation
│
├── PhishShift/                  # Intelligent Message Risk Scanner (Cybersecurity ML)
│   ├── backend/                 # FastAPI REST API with explainability engine
│   ├── frontend/                # React 19, Tailwind CSS v4 & Recharts dashboard
│   ├── ml/                      # TF-IDF, Calibrated SVM, NB, Robustness pipelines
│   ├── data/                    # Leakage-safe split datasets (train/val/holdout)
│   ├── docs/                    # Architecture & requirements traceability
│   └── README.md                # Dedicated PhishShift documentation
│
└── README.md                    # Root repository index
```

---

## 🚀 Projects Overview

### 1. OptiMach AI ⚡
> **Intelligent Industrial Predictive Maintenance & Machine Health Monitoring Platform**
- **Domain:** Industrial IoT, Digital Twins, Machine Learning, Reliability Engineering.
- **Key Highlights:**
  - Anticipates equipment failure within a **7-day predictive horizon** against the Microsoft Azure Predictive Maintenance benchmark.
  - Interactive **Three.js** 3D Factory Floor digital twin with real-time HUD telemetry.
  - Supervised Random Forest and Gradient Boosting classification models.
- **Directory:** [`OptiMach-AI/`](./OptiMach-AI/)
- **Quick Run:**
  ```powershell
  # Backend
  cd OptiMach-AI
  pip install -r requirements.txt
  python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload

  # Frontend
  cd OptiMach-AI/frontend
  npm install
  npm run dev
  ```

---

### 2. PhishShift 🛡️
> **Intelligent Message Risk Scanner & Explainable Threat Analysis Platform**
- **Domain:** Cybersecurity, Natural Language Processing (NLP), Model Explainability.
- **Key Highlights:**
  - Multi-tier ML pipeline: Calibrated Linear SVM (Platt Scaling), TF-IDF Logistic Regression, Naive Bayes, and Rule Baseline.
  - Word-level feature attribution and actionable safety prescriptions.
  - Zero-leakage campaign holdout validation and 8-variation adversarial robustness testing suite.
  - 100% automated test coverage (21/21 passing backend unit/integration tests).
- **Directory:** [`PhishShift/`](./PhishShift/)
- **Quick Run:**
  ```powershell
  # Backend
  cd PhishShift/backend
  pip install -r requirements.txt
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

  # Frontend
  cd PhishShift/frontend
  npm install
  npm run dev
  ```

---

## 🛠️ Global Prerequisites
- **Python:** 3.10+ (Tested on Python 3.12.10)
- **Node.js:** 18+ (Tested on Node.js v24.21.0, npm 11.19.0)
- **OS:** Windows / macOS / Linux
