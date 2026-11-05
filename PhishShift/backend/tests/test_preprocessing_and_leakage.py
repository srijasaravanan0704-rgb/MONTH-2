"""
Tests for Data Preprocessing, Deduplication, and Campaign Leakage Prevention.
"""

import os
import sys
import pandas as pd
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))
from preprocess import defang_url, remove_exact_and_near_duplicates, partition_campaign_holdout

def test_url_defanging():
    raw_text = "Click http://malicious-login.com/auth and https://secure-gate.tk to verify."
    defanged = defang_url(raw_text)
    
    assert "http://" not in defanged
    assert "https://" not in defanged
    assert "hxxps[://]" in defanged
    assert "[.]" in defanged

def test_exact_and_near_duplicate_removal():
    sample_data = [
        {"clean_text": "Exact duplicate message for testing", "campaign_group": "c1", "label": "phishing"},
        {"clean_text": "Exact duplicate message for testing", "campaign_group": "c1", "label": "phishing"},
        {"clean_text": "Exact duplicate message for testing!", "campaign_group": "c1", "label": "phishing"},
        {"clean_text": "Completely distinct legitimate meeting invitation", "campaign_group": "c2", "label": "benign"}
    ]
    df = pd.DataFrame(sample_data)
    df_clean, exact_removed, near_removed = remove_exact_and_near_duplicates(df, similarity_threshold=95.0)

    assert len(df_clean) < len(df)
    assert exact_removed >= 1

def test_campaign_leakage_prevention():
    """Verify that campaign groups in holdout are strictly absent from train and val."""
    processed_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")
    train_path = os.path.join(processed_dir, "train.csv")
    val_path = os.path.join(processed_dir, "val.csv")
    holdout_path = os.path.join(processed_dir, "campaign_holdout.csv")

    assert os.path.exists(train_path), "train.csv missing"
    assert os.path.exists(val_path), "val.csv missing"
    assert os.path.exists(holdout_path), "campaign_holdout.csv missing"

    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)
    df_holdout = pd.read_csv(holdout_path)

    train_camps = set(df_train["campaign_group"].unique())
    val_camps = set(df_val["campaign_group"].unique())
    holdout_camps = set(df_holdout["campaign_group"].unique())

    # ZERO campaign overlap
    assert len(train_camps.intersection(holdout_camps)) == 0, "Leakage detected: Training set contains holdout campaigns!"
    assert len(val_camps.intersection(holdout_camps)) == 0, "Leakage detected: Validation set contains holdout campaigns!"
    assert len(train_camps.intersection(val_camps)) == 0, "Leakage detected: Training set contains validation campaigns!"
