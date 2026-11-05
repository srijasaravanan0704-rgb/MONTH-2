# PhishShift: Data Pipeline Directory

This directory contains the dataset artifacts, raw generation scripts, and leakage-safe splits for PhishShift (ML-07).

---

### Folder Structure

```
data/
  raw/
    dataset_raw.csv           <- 492 initial generated records across 20 campaigns
  processed/
    train.csv                 <- 275 deduplicated training records (fit vectorizer here)
    val.csv                   <- 28 balanced validation records for tuning
    campaign_holdout.csv      <- 105 strictly unseen campaign records for testing
    preprocessing_metadata.json <- Traceable split metrics and leakage controls
  generate_dataset.py         <- Reproducible dataset generation pipeline
  README.md
```

### Reproducing the Dataset Pipeline

To regenerate and preprocess the data from scratch:

```powershell
# 1. Generate the raw dataset
python data/generate_dataset.py

# 2. Run deduplication and campaign-separated holdout splitting
python ml/preprocess.py
```
