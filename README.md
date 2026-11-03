# OptiMach AI ⚡
### Intelligent Industrial Predictive Maintenance & Machine Health Monitoring Platform

**Tagline:** *Predict Failures. Protect Machines. Maximize Performance.*

---

### Academic Project Information
- **Project Title:** Design and Development of a Machine Learning-Based Predictive Maintenance System for Industrial Equipment Failure Prediction and Health Monitoring
- **Project Level:** Final-Year Major Engineering Project
- **Domain:** Industrial Digital Twins, Machine Learning, Reliability Engineering & IoT Edge Monitoring

---

## 🌟 Executive Overview

**OptiMach AI** is an enterprise-grade industrial AI SaaS web platform developed for manufacturing plant reliability engineers and operations teams. The platform bridges physical equipment telemetry with supervised machine learning algorithms to anticipate equipment breakdown within a **7-day predictive failure horizon**, dramatically reducing unplanned downtime and eliminating catastrophic mechanical failures.

Calibrated strictly against the **Microsoft Azure Predictive Maintenance Benchmark**, OptiMach AI models multi-sensor telemetry across four primary physical parameters:
1. **Voltage ($V$):** Electrical line stability, brownout detection, and inverter harmonic anomalies.
2. **Rotation Speed ($\text{RPM}$):** Shaft angular velocity, belt slip, and gear train mechanical resistance.
3. **Fluid Pressure ($\text{psi}$):** Hydraulic circuit pressure, discharge valve obstruction, and cavitation detection.
4. **Vibration Velocity ($\text{mm/s}$):** ISO 10816 Class II mechanical vibration, bearing spalling, and unbalance detection.

---

## 🏗️ Architecture & Technology Stack

```
                                  +---------------------------------------+
                                  |         OptiMach AI Platform          |
                                  +---------------------------------------+
                                                     |
                   +---------------------------------+---------------------------------+
                   |                                                                   |
+--------------------------------------+                             +--------------------------------------+
|          Frontend Architecture       |                             |          Backend Architecture        |
+--------------------------------------+                             +--------------------------------------+
| • React 18 & TypeScript              |                             | • Python 3.12 & FastAPI              |
| • Tailwind CSS (Industrial Navy UI)  | <==== REST API & Stream === | • Uvicorn ASGI Server                |
| • Three.js (Procedural 3D Factory)   |                             | • SQLite with Seed Data              |
| • Recharts (Telemetry Oscilloscopes) |                             | • Joblib Model Serializers           |
| • jsPDF (Official Audit Reports)     |                             | • Scikit-learn, Pandas, NumPy        |
| • Lucide Icons & Canvas Confetti     |                             |                                      |
+--------------------------------------+                             +--------------------------------------+
```

### 🧠 Supervised Machine Learning Pipeline
All three models were trained and cross-validated on **12,000 multi-machine telemetry samples** adhering strictly to published Microsoft Azure telemetry distributions:
- **Random Forest Classifier (Main Candidate):** $98.08\%$ Accuracy, $0.8345$ F1-Score, $0.9434$ PR-AUC. Excels in capturing non-linear multi-sensor failure correlations.
- **Gradient Boosting Classifier (Comparison Model):** $98.54\%$ Accuracy, $0.8523$ F1-Score, $0.9560$ PR-AUC.
- **Logistic Regression (Baseline Model):** $81.13\%$ Accuracy, balanced class weighting to address the $5.0\%$ rare-event failure rate.

---

## 🚀 Key Features

### 1. Main Dashboard
- High-level KPI indicators: Total Fleet, Healthy Units, At Risk, Critical, 7-Day Predicted Failures, and Maintenance Due.
- 7-Day chronological sensor parameter progression and failure risk trends with interactive metric toggles.
- Equipment health distribution donut visualization.
- Machine-wise failure probability ranking.

### 2. 3D Industrial Machine Visualization & Digital Twin
- Interactive factory floor built with **Three.js** featuring metallic grid, safety pathways, and dynamic industrial lighting.
- Realistic procedural machines:
  - **MCH-01:** Heavy Duty Induction Motor with spinning drive shaft and ribbed stator.
  - **MCH-02:** 5-Axis CNC Milling Center with transparent glass observation cabinet and operator console.
  - **MCH-03:** Rotary Compressor with pressure accumulator cylinder and intercooler manifold.
  - **MCH-04:** Industrial Conveyor System with revolving rollers and continuously moving transport pallets.
  - **MCH-05:** Centrifugal Slurry Turbopump with volute spiral casing and discharge pipe.
- Interactive raycasting: click any 3D asset to inspect live telemetry, health scores, and trigger diagnostic workflows.
- Visual status beacons: Glowing Green (Normal), Pulsing Amber (Warning), Flashing Red (Critical).

### 3. Predictive Maintenance AI Module
- **Method A (Manual Sensor Input):** Interactive sliders and precision numeric inputs for Voltage, RPM, Pressure, and Vibration.
- **Physical Diagnostic Presets:** Instant loading of *Nominal State*, *Bearing Degradation*, *Pressure Surge*, and *Electrical Voltage Spike* scenarios.
- **Method B (Batch CSV Upload):** Drag-and-drop CSV batch inference, schema verification, sample CSV template download, and risk distribution breakdown.
- **Inference Diagnostics:** Contributing sensor deviations, z-score impact rankings, root cause physical hypotheses, and priority maintenance schedules.

### 4. ML Model Evaluation & Transparency
- Comprehensive validation table comparing Accuracy, Precision, Recall, F1, PR-AUC, and ROC-AUC.
- Interactive $2\times2$ Confusion Matrix visualizer displaying True Negatives, False Positives (Type I), False Negatives (Type II), and True Positives.
- Receiver Operating Characteristic (ROC) curves and Precision-Recall (PR) curves.
- Feature importance ranking confirming vibration ($~45\%$) as the primary predictive indicator.

### 5. Real-Time Live Monitoring
- Continuous animated sensor stream with configurable polling rates ($1\times$, $2\times$, Turbo).
- Rolling strip charts for all four sensors with safety thresholds and trip limit lines.
- Real-time threshold breach alerts.
- Industrial OPC-UA / MQTT IoT gateway readiness.

### 6. Maintenance Management Hub
- Work order dispatching and lifecycle tracking (Scheduled, In Progress, Completed, Pending).
- Filterable list and timeline views.
- Direct work order creation prefilled from predictive diagnostic alerts.
- Quick "Mark Completed" action with achievement feedback.

### 7. Compliance-Ready Report Generator
- Official PDF export formatted via **jsPDF** with executive summaries, telemetry tables, failure probabilities, and digital sign-off blocks.
- Fleet telemetry CSV export.
- Historical audit report archive.

---

## 🛠️ Installation & Setup Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.12)
- Node.js 18+ (Tested on Node.js v24)
- npm or pnpm

### 1. Backend Setup & Run

Open a terminal in the project root:

```bash
# Navigate to project directory
cd "optimach AI"

# Install backend dependencies
pip install -r requirements.txt

# (Optional) Re-train and evaluate ML models (models are already pre-trained and saved)
python backend/train_models.py

# Launch FastAPI backend server
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

The REST API and Swagger documentation will be active at:
- **Swagger Interactive API Docs:** `http://127.0.0.1:8000/docs`
- **API Health Check:** `http://127.0.0.1:8000/api/health`

---

### 2. Frontend Setup & Run

Open a second terminal window:

```bash
# Navigate to frontend directory
cd "optimach AI/frontend"

# Start Vite Development Server
npm run dev
```

The web application will be accessible at:
- **Local URL:** `http://localhost:5173`

---

## 📂 Project Directory Structure

```
optimach-ai/
├── backend/
│   ├── app.py                   # FastAPI application with 30 REST endpoints
│   ├── database.py              # SQLite database schema, initialization & seed data
│   ├── ml_engine.py             # Inference pipeline, feature deviations & AI advice
│   ├── train_models.py          # Azure PM training script (RF, GB, LR)
│   ├── optimach.db              # SQLite persistence database
│   ├── models/                  # Trained serialized models & authentic metrics
│   │   ├── random_forest.joblib
│   │   ├── gradient_boosting.joblib
│   │   ├── logistic_regression.joblib
│   │   ├── scaler.joblib
│   │   └── metrics.json
│   └── data/                    # Sample dataset and CSV batch templates
│       ├── azure_telemetry_sample.csv
│       └── batch_test_machines.csv
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # React application bootstrap
│   │   ├── App.tsx              # Root container & cross-page navigation
│   │   ├── index.css            # Tailwind directives & glassmorphic styles
│   │   ├── types/               # TypeScript data definitions & API interfaces
│   │   ├── services/
│   │   │   └── api.ts           # API client service connecting to FastAPI
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── CircularGauge.tsx
│   │   │   └── NotificationDrawer.tsx
│   │   └── pages/               # Primary platform views
│   │       ├── DashboardPage.tsx
│   │       ├── Factory3DPage.tsx
│   │       ├── MachinesPage.tsx
│   │       ├── PredictiveAiPage.tsx
│   │       ├── MlEvaluationPage.tsx
│   │       ├── LiveMonitoringPage.tsx
│   │       ├── MaintenancePage.tsx
│   │       ├── ReportsPage.tsx
│   │       └── SettingsPage.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── requirements.txt             # Python requirements
└── README.md                    # Project documentation
```

---

## 🧪 Testing & Verification

1. **ML Model Predictions:** Test manual inputs in *Predictive Analysis*. Observe how severe vibration (> 50 mm/s) elevates failure hazard into the **Critical** tier with actionable recommendations.
2. **CSV Batch Inference:** In *Predictive Analysis > Method B*, download the sample CSV and upload it to witness instant batch classification.
3. **Interactive 3D Floor:** Navigate to *3D Factory Twin*, inspect rotating motors and moving conveyor systems, and click machines to trigger the live HUD inspector.
4. **Maintenance Work Orders:** Dispatch work orders directly from critical alerts, edit their status, and mark them completed to trigger completion feedback.
5. **Report Generation:** Go to *Industrial Reports*, customize machine scopes, and click **Download Official PDF** for a printable plant health audit document.

---

*OptiMach AI — Predict Failures. Protect Machines. Maximize Performance.*

