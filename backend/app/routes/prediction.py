from fastapi import APIRouter, HTTPException, status
from app.schemas.email import EmailRequest, PredictionResponse, StatisticsResponse
from app.services.predictor import predictor_service

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=PredictionResponse)
def predict_email_spam(request: EmailRequest):
    """
    Classifies input email subject and body as SPAM or HAM using the trained ML model.
    """
    sender = request.sender.strip() if request.sender else ""
    subject = request.subject.strip()
    body = request.body.strip()
    
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
