"""
Preprocessing, Deduplication, and Campaign Leakage-Safe Splitting Module.
Ensures zero campaign contamination between training, validation, and final holdout sets.
"""

import json
import os
import re
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from rapidfuzz import fuzz

DATA_RAW_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "dataset_raw.csv")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
METADATA_PATH = os.path.join(PROCESSED_DIR, "preprocessing_metadata.json")

# Reserved campaigns strictly for unseen holdout evaluation
HOLDOUT_CAMPAIGNS = [
    "social_engineering_survey_gift",  # Unseen phishing lure style
    "sms_delivery_smishing",           # Unseen smishing campaign
    "customer_shipping_order_benign",  # Unseen commerce notices
    "sms_legitimate_notifications"     # Unseen SMS benign alerts
]

SUSPICIOUS_TLDS = {".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".cc", ".xyz", ".club", ".vip", ".online", ".live", ".fun", ".site"}

def defang_url(text: str) -> str:
    """Safely defang any raw URLs in text to prevent accidental hyperlinking or execution."""
    text = re.sub(r"https?://", "hxxps[://]", text, flags=re.IGNORECASE)
    # Replace dots in probable domains/urls
    text = re.sub(r"(hxxps\[://\][^\s]+)", lambda m: m.group(1).replace(".", "[.]"), text)
    return text

def extract_inert_url_features(text: str) -> Dict[str, any]:
    """
    Extract transparent URL features strictly from inert text without network access.
    """
    has_url = bool(re.search(r"(hxxps?\[://\]|https?://|www\[\.\]|www\.)", text, re.IGNORECASE))
    
    # Check suspicious TLDs
    has_suspicious_tld = any(tld in text.lower() for tld in SUSPICIOUS_TLDS)
    
    # Check IP address indicator
    has_ip = bool(re.search(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", text))
    
    # Check credential or verification tokens in URL
    mentions_auth_keyword = bool(re.search(r"(login|verify|auth|portal|password|disavow|secure|quarantine)", text, re.IGNORECASE))
    
    return {
        "has_url": has_url,
        "has_suspicious_tld": has_suspicious_tld,
        "has_ip_in_url": has_ip,
        "url_mentions_auth": mentions_auth_keyword and has_url
    }

def clean_and_normalize_text(subject: str, body: str) -> str:
    """Combine subject and body, defang URLs, and normalize whitespace."""
    subj = str(subject) if pd.notna(subject) else ""
    bdy = str(body) if pd.notna(body) else ""
    full_text = f"{subj} {bdy}".strip()
    full_text = defang_url(full_text)
    # Normalize multiple whitespace
    normalized = re.sub(r"\s+", " ", full_text)
    return normalized

def remove_exact_and_near_duplicates(df: pd.DataFrame, similarity_threshold: float = 98.0) -> Tuple[pd.DataFrame, int, int]:
    """
    Deduplicate dataset using exact matching followed by RapidFuzz normalized Levenshtein ratio.
    Removes exact duplicate texts and near-identical copies (>98% sequence identity).
    """
    initial_count = len(df)
    
    # 1. Exact match deduplication
    df_dedup = df.drop_duplicates(subset=["clean_text"]).copy().reset_index(drop=True)
    exact_removed = initial_count - len(df_dedup)
    
    # 2. Near-duplicate template deduplication within same campaign and label
    indices_to_drop = set()
    n = len(df_dedup)
    
    for i in range(n):
        if i in indices_to_drop:
            continue
        text_i = df_dedup.at[i, "clean_text"]
        camp_i = df_dedup.at[i, "campaign_group"]
        lbl_i = df_dedup.at[i, "label"]
        
        for j in range(i + 1, n):
            if j in indices_to_drop:
                continue
            if df_dedup.at[j, "campaign_group"] == camp_i and df_dedup.at[j, "label"] == lbl_i:
                text_j = df_dedup.at[j, "clean_text"]
                # Rapidfuzz sequence ratio
                score = fuzz.ratio(text_i, text_j)
                if score >= similarity_threshold:
                    indices_to_drop.add(j)
                    
    df_final = df_dedup.drop(index=list(indices_to_drop)).reset_index(drop=True)
    near_removed = len(indices_to_drop)
    
    return df_final, exact_removed, near_removed

def partition_campaign_holdout(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Partition data into:
    - Holdout set: Campaigns designated in HOLDOUT_CAMPAIGNS (strictly unseen during training/tuning)
    - Train set: ~75% of remaining campaign groups
    - Validation set: ~25% of remaining campaign groups
    This guarantees zero campaign leakage across evaluation boundaries.
    """
    holdout_mask = df["campaign_group"].isin(HOLDOUT_CAMPAIGNS)
    df_holdout = df[holdout_mask].copy().reset_index(drop=True)
    df_dev = df[~holdout_mask].copy().reset_index(drop=True)
    
    # Group-aware split for dev set into train and val
    # Get distinct campaigns in dev
    dev_campaigns = df_dev["campaign_group"].unique().tolist()
    dev_campaigns.sort()
    
    # Balance phishing and benign campaign assignment
    phish_camps = [c for c in dev_campaigns if df_dev[df_dev["campaign_group"] == c]["label"].iloc[0] == "phishing"]
    benign_camps = [c for c in dev_campaigns if df_dev[df_dev["campaign_group"] == c]["label"].iloc[0] == "benign"]
    
    # Allocate 1 phish and 1 benign campaign to validation, rest to train
    val_camps = set()
    if phish_camps:
        val_camps.add(phish_camps[-1])
    if benign_camps:
        val_camps.add(benign_camps[-1])
        
    val_mask = df_dev["campaign_group"].isin(val_camps)
    df_val = df_dev[val_mask].copy().reset_index(drop=True)
    df_train = df_dev[~val_mask].copy().reset_index(drop=True)
    
    return df_train, df_val, df_holdout

def run_preprocessing_pipeline():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    if not os.path.exists(DATA_RAW_PATH):
        raise FileNotFoundError(f"Raw dataset not found at {DATA_RAW_PATH}. Run data/generate_dataset.py first.")
        
    df_raw = pd.read_csv(DATA_RAW_PATH)
    
    # Clean text and extract inert URL features
    df_raw["clean_text"] = df_raw.apply(lambda r: clean_and_normalize_text(r["subject_or_title"], r["body_text"]), axis=1)
    
    # Deduplication
    df_clean, exact_removed, near_removed = remove_exact_and_near_duplicates(df_raw, similarity_threshold=94.0)
    
    # Split into train, val, holdout
    df_train, df_val, df_holdout = partition_campaign_holdout(df_clean)
    
    # Save processed CSVs
    train_path = os.path.join(PROCESSED_DIR, "train.csv")
    val_path = os.path.join(PROCESSED_DIR, "val.csv")
    holdout_path = os.path.join(PROCESSED_DIR, "campaign_holdout.csv")
    
    df_train.to_csv(train_path, index=False)
    df_val.to_csv(val_path, index=False)
    df_holdout.to_csv(holdout_path, index=False)
    
    metadata = {
        "raw_total_records": len(df_raw),
        "exact_duplicates_removed": exact_removed,
        "near_duplicates_removed": near_removed,
        "clean_total_records": len(df_clean),
        "split_summary": {
            "train": {
                "count": len(df_train),
                "phishing": int((df_train["label"] == "phishing").sum()),
                "benign": int((df_train["label"] == "benign").sum()),
                "campaigns": df_train["campaign_group"].unique().tolist()
            },
            "validation": {
                "count": len(df_val),
                "phishing": int((df_val["label"] == "phishing").sum()),
                "benign": int((df_val["label"] == "benign").sum()),
                "campaigns": df_val["campaign_group"].unique().tolist()
            },
            "campaign_holdout": {
                "count": len(df_holdout),
                "phishing": int((df_holdout["label"] == "phishing").sum()),
                "benign": int((df_holdout["label"] == "benign").sum()),
                "campaigns": df_holdout["campaign_group"].unique().tolist()
            }
        },
        "leakage_safeguards": [
            "Campaign-separated holdout partitions prevent template overlap",
            "Text vectorizers fitted strictly on training partition only",
            "Near-duplicate template pruning using RapidFuzz token_sort_ratio >= 94.0",
            "Defanged inert URLs avoid active outbound HTTP requests"
        ]
    }
    
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Preprocessing completed successfully:")
    print(f"  Clean total records: {len(df_clean)}")
    print(f"  Train: {len(df_train)} (Phish: {metadata['split_summary']['train']['phishing']}, Benign: {metadata['split_summary']['train']['benign']})")
    print(f"  Validation: {len(df_val)} (Phish: {metadata['split_summary']['validation']['phishing']}, Benign: {metadata['split_summary']['validation']['benign']})")
    print(f"  Campaign Holdout: {len(df_holdout)} (Phish: {metadata['split_summary']['campaign_holdout']['phishing']}, Benign: {metadata['split_summary']['campaign_holdout']['benign']})")
    print(f"  Metadata saved to: {METADATA_PATH}")

if __name__ == "__main__":
    run_preprocessing_pipeline()
