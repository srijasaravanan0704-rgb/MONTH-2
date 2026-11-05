"""
Model Training Pipeline for PhishShift.
Trains and compares:
1. Transparent Rule-Based Baseline
2. TF-IDF + Logistic Regression
3. TF-IDF + Linear SVM (Calibrated with Platt scaling)
4. TF-IDF + Multinomial Naive Bayes
Saves artifacts, vectorizers, and calibration data for reproducible inference.
"""

import json
import os
import sys

# Limit threads to eliminate Windows OpenMP contention
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from datetime import datetime

# Ensure ml directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC

from rule_baseline import RuleBasedPhishingClassifier

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")

def load_data():
    train_path = os.path.join(PROCESSED_DIR, "train.csv")
    val_path = os.path.join(PROCESSED_DIR, "val.csv")
    holdout_path = os.path.join(PROCESSED_DIR, "campaign_holdout.csv")

    if not os.path.exists(train_path):
        raise FileNotFoundError(f"Missing {train_path}. Run ml/preprocess.py first.")

    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)
    df_holdout = pd.read_csv(holdout_path) if os.path.exists(holdout_path) else None

    return df_train, df_val, df_holdout

def evaluate_predictions(y_true, y_pred, y_prob=None):
    """Calculate key metrics including false-positive rate."""
    cm = confusion_matrix(y_true, y_pred, labels=["benign", "phishing"])
    tn, fp, fn, tp = cm.ravel()
    
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, pos_label="phishing", zero_division=0)
    rec = recall_score(y_true, y_pred, pos_label="phishing", zero_division=0)
    f1 = f1_score(y_true, y_pred, pos_label="phishing", zero_division=0)
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "false_positive_rate": round(float(fpr), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        }
    }

def train_and_evaluate_all():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    df_train, df_val, df_holdout = load_data()

    X_train_raw = df_train["clean_text"].tolist()
    y_train = df_train["label"].tolist()

    X_val_raw = df_val["clean_text"].tolist()
    y_val = df_val["label"].tolist()

    # 1. Fit TF-IDF strictly on training set to prevent data leakage
    print("Fitting TF-IDF Vectorizer on training partition...")
    vectorizer = TfidfVectorizer(
        sublinear_tf=True,
        ngram_range=(1, 2),
        min_df=2,
        max_features=3000,
        stop_words="english"
    )
    X_train_vec = vectorizer.fit_transform(X_train_raw)
    X_val_vec = vectorizer.transform(X_val_raw)

    feature_names = vectorizer.get_feature_names_out().tolist()

    # Model Dictionary
    models = {}
    metrics_summary = {}

    # --- MODEL 1: Rule-Based Baseline ---
    print("\nEvaluating Rule-Based Baseline...")
    rule_model = RuleBasedPhishingClassifier()
    y_pred_rule = rule_model.predict(X_val_raw)
    rule_metrics = evaluate_predictions(y_val, y_pred_rule)
    metrics_summary["rule_baseline"] = {
        "display_name": "Rule-Based Heuristic Baseline",
        "description": "Deterministic pattern matching on urgency, credential harvesting, financial triggers, and inert URL tokens",
        "metrics": rule_metrics
    }
    models["rule_baseline"] = rule_model

    # --- MODEL 2: Logistic Regression ---
    print("Training TF-IDF Logistic Regression...")
    log_reg = LogisticRegression(C=1.5, max_iter=1000, random_state=42)
    log_reg.fit(X_train_vec, y_train)
    y_pred_lr = log_reg.predict(X_val_vec)
    lr_probs = log_reg.predict_proba(X_val_vec)[:, 1]
    lr_metrics = evaluate_predictions(y_val, y_pred_lr, lr_probs)
    metrics_summary["logistic_regression"] = {
        "display_name": "TF-IDF Logistic Regression",
        "description": "Linear classifier with L2 regularization and natural calibrated log-odds probabilities",
        "metrics": lr_metrics
    }
    models["logistic_regression"] = log_reg

    # --- MODEL 3: Linear SVM with CalibratedClassifierCV ---
    print("Training Calibrated Linear SVM...")
    # Wrap LinearSVC in CalibratedClassifierCV to provide reliable Platt scaling probabilities
    base_svc = LinearSVC(C=1.0, random_state=42, max_iter=2000)
    calibrated_svm = CalibratedClassifierCV(estimator=base_svc, cv=3)
    calibrated_svm.fit(X_train_vec, y_train)
    y_pred_svm = calibrated_svm.predict(X_val_vec)
    svm_probs = calibrated_svm.predict_proba(X_val_vec)[:, 1]
    svm_metrics = evaluate_predictions(y_val, y_pred_svm, svm_probs)
    metrics_summary["linear_svm"] = {
        "display_name": "TF-IDF Linear SVM (Platt Calibrated)",
        "description": "Support Vector Machine with maximum margin hyperplane, calibrated using Platt sigmoid scaling",
        "metrics": svm_metrics
    }
    models["linear_svm"] = calibrated_svm

    # --- MODEL 4: Multinomial Naive Bayes ---
    print("Training Multinomial Naive Bayes...")
    nb_model = MultinomialNB(alpha=0.5)
    nb_model.fit(X_train_vec, y_train)
    y_pred_nb = nb_model.predict(X_val_vec)
    nb_probs = nb_model.predict_proba(X_val_vec)[:, 1]
    nb_metrics = evaluate_predictions(y_val, y_pred_nb, nb_probs)
    metrics_summary["naive_bayes"] = {
        "display_name": "Multinomial Naive Bayes",
        "description": "Probabilistic bag-of-words classifier using Dirichlet smoothing",
        "metrics": nb_metrics
    }
    models["naive_bayes"] = nb_model

    # Extract Top Phishing and Benign Feature Weights from Logistic Regression
    lr_coefs = log_reg.coef_[0]
    # Classes order: log_reg.classes_
    phish_class_idx = list(log_reg.classes_).index("phishing")
    coef_sign = 1 if phish_class_idx == 1 else -1

    top_phish_indices = np.argsort(lr_coefs * coef_sign)[-25:][::-1]
    top_benign_indices = np.argsort(lr_coefs * coef_sign)[:25]

    top_phish_features = [
        {"feature": feature_names[i], "weight": round(float(lr_coefs[i] * coef_sign), 4)}
        for i in top_phish_indices
    ]
    top_benign_features = [
        {"feature": feature_names[i], "weight": round(float(abs(lr_coefs[i])), 4)}
        for i in top_benign_indices
    ]

    # Save artifacts
    print("\nSaving model artifacts to disk...")
    joblib.dump(vectorizer, os.path.join(ARTIFACTS_DIR, "tfidf_vectorizer.joblib"))
    joblib.dump(rule_model, os.path.join(ARTIFACTS_DIR, "rule_baseline.joblib"))
    joblib.dump(log_reg, os.path.join(ARTIFACTS_DIR, "logistic_regression.joblib"))
    joblib.dump(calibrated_svm, os.path.join(ARTIFACTS_DIR, "linear_svm.joblib"))
    joblib.dump(nb_model, os.path.join(ARTIFACTS_DIR, "naive_bayes.joblib"))

    with open(os.path.join(ARTIFACTS_DIR, "feature_names.json"), "w", encoding="utf-8") as f:
        json.dump(feature_names, f)

    training_metadata = {
        "training_timestamp": datetime.utcnow().isoformat() + "Z",
        "model_version": "1.0.0-ml07",
        "train_samples_count": len(X_train_raw),
        "validation_samples_count": len(X_val_raw),
        "vocabulary_size": len(feature_names),
        "models_summary": metrics_summary,
        "explainability": {
            "top_phishing_features": top_phish_features,
            "top_benign_features": top_benign_features
        }
    }

    with open(os.path.join(ARTIFACTS_DIR, "model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(training_metadata, f, indent=2)

    with open(os.path.join(REPORTS_DIR, "validation_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)

    print("Training finished successfully.")
    for name, data in metrics_summary.items():
        m = data["metrics"]
        print(f"  {name:20s} | Acc: {m['accuracy']:.4f} | Prec: {m['precision']:.4f} | Rec: {m['recall']:.4f} | F1: {m['f1_score']:.4f} | FPR: {m['false_positive_rate']:.4f}")

if __name__ == "__main__":
    train_and_evaluate_all()
