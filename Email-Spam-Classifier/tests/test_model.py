import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app.services.predictor import predictor_service

def test_model_loaded():
    assert predictor_service.is_loaded is True
    assert predictor_service.model is not None
    assert predictor_service.vectorizer is not None

def test_spam_prediction():
    spam_subject = "Urgent! Claim your cash prize"
    spam_body = "Congratulations! You have won $1000 cash. Click http://claim.com now to get your reward!"
    result = predictor_service.predict(spam_subject, spam_body)
    
    assert result["prediction"] == "spam"
    assert result["spam_probability"] > 0.5
    assert result["confidence"] > 50.0
    assert len(result["keywords"]) > 0

def test_ham_prediction():
    ham_subject = "Project Update Meeting"
    ham_body = "Hi team, please find attached the quarterly report. Let us discuss the project schedule tomorrow at 10 AM."
    result = predictor_service.predict(ham_subject, ham_body)
    
    assert result["prediction"] == "ham"
    assert result["ham_probability"] > 0.5
    assert result["confidence"] > 50.0
