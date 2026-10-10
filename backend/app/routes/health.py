from fastapi import APIRouter
from app.services.predictor import predictor_service

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """
    Returns server status and model load state.
    """
    return {
        "status": "healthy",
        "model_loaded": predictor_service.is_loaded,
        "selected_algorithm": predictor_service.metrics.get("selected_algorithm", "Unknown")
    }
