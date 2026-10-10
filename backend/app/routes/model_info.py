from fastapi import APIRouter
from app.services.predictor import predictor_service

router = APIRouter(tags=["Model Info"])

@router.get("/model-info")
def get_model_information():
    """
    Returns actual training metrics, algorithm details, dataset info, and confusion matrix.
    """
    info = predictor_service.get_model_info()
    metrics = info.get("metrics", {})
    selected_metrics = metrics.get("selected_metrics", {})
    
    return {
        "status": info.get("status"),
        "model_loaded": info.get("model_loaded"),
        "selected_algorithm": metrics.get("selected_algorithm", "Multinomial Naive Bayes"),
        "dataset_name": metrics.get("dataset_name", "UCI / Kaggle SMS & Email Spam Collection"),
        "dataset_size": metrics.get("dataset_size", 0),
        "train_samples": metrics.get("train_samples", 0),
        "test_samples": metrics.get("test_samples", 0),
        "feature_count": metrics.get("feature_count", 0),
        "accuracy": selected_metrics.get("accuracy", 0.0),
        "precision": selected_metrics.get("precision", 0.0),
        "recall": selected_metrics.get("recall", 0.0),
        "f1_score": selected_metrics.get("f1_score", 0.0),
        "false_positives": selected_metrics.get("false_positives", 0),
        "false_negatives": selected_metrics.get("false_negatives", 0),
        "true_negatives": selected_metrics.get("true_negatives", 0),
        "true_positives": selected_metrics.get("true_positives", 0),
        "confusion_matrix": selected_metrics.get("confusion_matrix", []),
        "all_models_comparison": metrics.get("all_models_comparison", {}),
        "preprocessing_details": metrics.get("preprocessing_details", {})
    }
