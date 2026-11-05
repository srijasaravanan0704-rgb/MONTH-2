import os
import sys
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query
from app.schemas.email import EmailRequest, PredictionResponse, StatisticsResponse
from app.services.predictor import predictor_service

router = APIRouter(tags=["Prediction"])

def _find_sample_dataset_path() -> Optional[str]:
    curr = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(curr, "..", "..", "models", "sample_500_emails.json")),
        os.path.abspath(os.path.join(curr, "..", "..", "..", "ml", "dataset", "sample_500_emails.json")),
        os.path.abspath(os.path.join(os.getcwd(), "backend", "models", "sample_500_emails.json")),
        os.path.abspath(os.path.join(os.getcwd(), "models", "sample_500_emails.json")),
        os.path.abspath(os.path.join(os.getcwd(), "ml", "dataset", "sample_500_emails.json")),
        "/var/task/backend/models/sample_500_emails.json",
        "/var/task/models/sample_500_emails.json",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None

_cached_samples: Optional[List[Dict[str, Any]]] = None

def _get_samples() -> List[Dict[str, Any]]:
    global _cached_samples
    if _cached_samples is None:
        sample_path = _find_sample_dataset_path()
        if sample_path and os.path.exists(sample_path):
            try:
                with open(sample_path, "r", encoding="utf-8") as f:
                    _cached_samples = json.load(f)
            except Exception:
                _cached_samples = []
        else:
            _cached_samples = []
    return _cached_samples

@router.get("/samples")
def get_sample_dataset(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Returns sample emails from the 500-sample dataset library for one-click testing.
    """
    all_samples = _get_samples()
    filtered = all_samples

    if isinstance(category, str) and category.strip() and category.lower() != "all":
        cat_lower = category.lower().strip()
        filtered = [s for s in filtered if cat_lower in s.get("category", "").lower()]

    if isinstance(search, str) and search.strip():
        search_lower = search.lower().strip()
        filtered = [
            s for s in filtered
            if search_lower in s.get("subject", "").lower()
            or search_lower in s.get("sender", "").lower()
            or search_lower in s.get("body", "").lower()
        ]

    total_matches = len(filtered)
    paged = filtered[offset : offset + limit]

    # Available categories
    categories = sorted(list({s.get("category", "") for s in all_samples if s.get("category")}))

    return {
        "total_samples": len(all_samples),
        "total_matches": total_matches,
        "offset": offset,
        "limit": limit,
        "categories": categories,
        "samples": paged
    }

@router.post("/predict", response_model=PredictionResponse)
def predict_email_spam(request: EmailRequest):
    """
    Classifies input email subject and body as SPAM or HAM using the trained ML model.
    """
    sender = request.sender.strip() if request.sender else ""
    subject = request.subject.strip() if request.subject else ""
    body = request.body.strip() if request.body else ""
    
    if not sender and not subject and not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sender, subject, and body cannot all be empty. Please provide email content to analyze."
        )
        
    try:
        result = predictor_service.predict(subject=subject, body=body, sender=sender)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during prediction processing: {str(e)}"
        )

@router.get("/statistics", response_model=StatisticsResponse)
def get_prediction_statistics():
    """
    Returns real prediction metrics & history for the Dashboard.
    """
    return predictor_service.get_statistics()

@router.delete("/clear-history")
def clear_prediction_history():
    """
    Clears all saved prediction history logs.
    """
    predictor_service.clear_history()
    return {"message": "Prediction history cleared successfully."}

@router.post("/feedback")
def submit_user_feedback(data: dict):
    """
    Records user accuracy feedback for audit logging and model retraining pipelines.
    """
    is_correct = bool(data.get("is_correct", True))
    feedback_text = str(data.get("feedback", ""))
    predictor_service.record_feedback(is_correct, feedback_text)
    return {"status": "success", "message": "Feedback recorded for model audit logging."}
