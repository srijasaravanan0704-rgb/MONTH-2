import os
import urllib.request
import pandas as pd
import io

DATASET_PATH = os.path.join(os.path.dirname(__file__), "spam.csv")
DATASET_URL = "https://raw.githubusercontent.com/codebasics/py/master/ML/14_naive_bayes/spam.csv"

def download_and_verify_dataset():
    if os.path.exists(DATASET_PATH):
        print(f"Dataset already exists at {DATASET_PATH}")
        df = pd.read_csv(DATASET_PATH)
        print(f"Loaded existing dataset: {df.shape[0]} rows, columns: {df.columns.tolist()}")
        return df

    print(f"Downloading dataset from {DATASET_URL}...")
    req = urllib.request.Request(DATASET_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8', errors='ignore')
        df = pd.read_csv(io.StringIO(content))

    # Standardize columns to 'label' and 'text'
    if 'Category' in df.columns:
        df = df.rename(columns={'Category': 'label', 'Message': 'text'})
    
    # Clean nulls
    df = df.dropna(subset=['text', 'label'])
    df['label'] = df['label'].astype(str).str.lower().str.strip()
    
    # Save locally
    df.to_csv(DATASET_PATH, index=False)
    print(f"Dataset saved to {DATASET_PATH}. Total samples: {len(df)}")
    print("Class distribution:")
    print(df['label'].value_counts())
    return df

if __name__ == "__main__":
    download_and_verify_dataset()
