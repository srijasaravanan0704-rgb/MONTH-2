import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from preprocessing import preprocess_text

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "spam.csv")
BACKEND_MODELS_DIR = os.path.join(BASE_DIR, "..", "backend", "models")
ML_MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(BACKEND_MODELS_DIR, exist_ok=True)
os.makedirs(ML_MODELS_DIR, exist_ok=True)

def train_and_evaluate():
    print("--- STEP 1: Loading Dataset ---")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Please run download_dataset.py first.")
    
    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded {len(df)} samples.")
    print("Class distribution:\n", df['label'].value_counts())
    
    print("\n--- STEP 2: Text Preprocessing ---")
    df['cleaned_text'] = df['text'].apply(preprocess_text)
    
    # Filter empty texts if any
    df = df[df['cleaned_text'].str.strip() != ''].reset_index(drop=True)
    
    # Map labels: ham -> 0, spam -> 1
    df['target'] = df['label'].apply(lambda x: 1 if str(x).lower().strip() == 'spam' else 0)
    
    X = df['cleaned_text']
    y = df['target']
    
    print("\n--- STEP 3: Train / Test Split ---")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")
    
    print("\n--- STEP 4: TF-IDF Vectorization ---")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        sublinear_tf=True
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")
    
    print("\n--- STEP 5: Training & Evaluating Algorithms ---")
    models = {
        "Multinomial Naive Bayes": MultinomialNB(alpha=0.1),
        "Logistic Regression": LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced', random_state=42),
        "Support Vector Machine": SVC(C=1.0, kernel='linear', probability=True, class_weight='balanced', random_state=42)
    }
    
    results = {}
    trained_model_objects = {}
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_tfidf, y_train)
        y_pred = model.predict(X_test_tfidf)
        
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred))
        rec = float(recall_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred))
        cm = confusion_matrix(y_test, y_pred).tolist() # [[TN, FP], [FN, TP]]
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_negatives": int(tn),
            "true_positives": int(tp),
            "confusion_matrix": cm
        }
        trained_model_objects[name] = model
        
        print(f"Results for {name}:")
        print(f"  Accuracy : {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall   : {rec:.4f}")
        print(f"  F1 Score : {f1:.4f}")
        print(f"  False Positives: {fp}, False Negatives: {fn}")
        print(f"  Confusion Matrix: {cm}")

    print("\n--- STEP 6: Best Model Selection ---")
    # In spam detection, precision (minimizing false positives) and F1-score are key.
    # We score models based on F1-Score with strong penalty for false positives.
    best_model_name = max(
        results.keys(), 
        key=lambda k: (results[k]['f1_score'], results[k]['precision'], -results[k]['false_positives'])
    )
    
    best_model = trained_model_objects[best_model_name]
    best_metrics = results[best_model_name]
    
    print(f"\n>>> Selected Best Model: '{best_model_name}' <<<")
    print(f"  F1 Score : {best_metrics['f1_score']}")
    print(f"  Precision: {best_metrics['precision']}")
    print(f"  Recall   : {best_metrics['recall']}")
    print(f"  False Positives: {best_metrics['false_positives']}")

    print("\n--- STEP 7: Saving Model & Vectorizer Artifacts ---")
    metrics_data = {
        "dataset_name": "UCI / Kaggle SMS & Email Spam Collection",
        "dataset_size": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_count": len(vectorizer.vocabulary_),
        "selected_algorithm": best_model_name,
        "selected_metrics": best_metrics,
        "all_models_comparison": results,
        "preprocessing_details": {
            "lowercasing": True,
            "url_normalization": True,
            "email_normalization": True,
            "currency_normalization": True,
            "punctuation_tokenization": True,
            "stopword_removal": True,
            "stemming": "PorterStemmer"
        }
    }
    
    # Save to backend/models/
    joblib.dump(best_model, os.path.join(BACKEND_MODELS_DIR, "spam_model.pkl"))
    joblib.dump(vectorizer, os.path.join(BACKEND_MODELS_DIR, "tfidf_vectorizer.pkl"))
    with open(os.path.join(BACKEND_MODELS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)
        
    # Save to ml/models/
    joblib.dump(best_model, os.path.join(ML_MODELS_DIR, "spam_model.pkl"))
    joblib.dump(vectorizer, os.path.join(ML_MODELS_DIR, "tfidf_vectorizer.pkl"))
    with open(os.path.join(ML_MODELS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"Successfully saved artifacts to {BACKEND_MODELS_DIR} and {ML_MODELS_DIR}.")
    return metrics_data

if __name__ == "__main__":
    train_and_evaluate()
