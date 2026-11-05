# 📧 Email Spam Classifier

An end-to-end Machine Learning web application designed to detect and classify spam emails using Natural Language Processing (NLP) and supervised learning.

## 🚀 Features

- **Machine Learning Engine**: TF-IDF vectorization with trained classification models (Scikit-learn).
- **Keyword Extraction**: Identifies suspicious spam triggers and keywords.
- **RESTful API**: FastAPI backend providing endpoints for single predictions, bulk predictions, and metrics.
- **Interactive UI**: Modern React + Vite frontend with Tailwind CSS styling and intuitive dashboard.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: FastAPI, Uvicorn, Pydantic
- **Machine Learning**: Scikit-Learn, Joblib, Pandas, NumPy, NLTK

---

## 📂 Project Structure

```
Email spam classifier/
├── backend/            # FastAPI REST backend
│   ├── app/
│   │   ├── routes/     # API route handlers
│   │   ├── schemas/    # Pydantic data schemas
│   │   ├── services/   # Preprocessing & ML inference
│   │   └── main.py     # FastAPI entrypoint
│   ├── models/         # Model weights & prediction history
│   └── requirements.txt
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── ml/                 # Model training & datasets
│   ├── dataset/
│   ├── models/
│   ├── preprocessing.py
│   └── train.py
├── tests/              # Automated unit tests
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173` with the backend API at `http://localhost:8000`.
