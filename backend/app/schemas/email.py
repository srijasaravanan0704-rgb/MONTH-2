from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class EmailRequest(BaseModel):
    sender: Optional[str] = Field(default="", description="Sender email address")
    subject: str = Field(default="", max_length=2000, description="Subject line of the email")
    body: str = Field(default="", max_length=50000, description="Main body content of the email")

    @field_validator('body')
    def validate_content_not_empty(cls, v, values):
        # We also check subject in root validator or here
        return v

    def get_combined_text(self) -> str:
        s = self.subject.strip()
        b = self.body.strip()
        if not s and not b:
            raise ValueError("Email subject and body cannot both be empty.")
        if s and b:
            return f"{s} {b}"
        return s or b

class KeywordDetail(BaseModel):
    word: str
    raw_word: str
    score: float
    is_spam_indicator: bool

class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="'spam' or 'ham'")
    spam_probability: float = Field(..., ge=0.0, le=1.0)
    ham_probability: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=100.0)
    keywords: List[str]
    keyword_details: List[KeywordDetail]
    explanation: str
    processed_text: str
    timestamp: str

class ModelInfoResponse(BaseModel):
    status: str
    model_loaded: bool
    selected_algorithm: str
    dataset_name: str
    dataset_size: int
    train_samples: int
    test_samples: int
    feature_count: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positives: int
    false_negatives: int
    confusion_matrix: List[List[int]]
    all_models_comparison: Dict[str, Any]
    preprocessing_details: Dict[str, Any]

class StatisticsResponse(BaseModel):
    total_predictions: int
    spam_count: int
    ham_count: int
    spam_percentage: float
    ham_percentage: float
    recent_predictions: List[Dict[str, Any]]
    history: Optional[List[Dict[str, Any]]] = None
