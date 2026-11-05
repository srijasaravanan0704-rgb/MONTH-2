"""
Pydantic Schemas for PhishShift API.
Strict validation and typed response schemas.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class ScanRequest(BaseModel):
    channel: str = Field(default="email", description="Message channel: 'email' or 'sms'")
    subject: Optional[str] = Field(default=None, max_length=300, description="Optional subject line for emails")
    body: str = Field(..., min_length=3, max_length=10000, description="The message body text to analyze")
    model_name: Optional[str] = Field(default=None, description="Specific model to run: linear_svm, logistic_regression, naive_bayes, rule_baseline")
    store_body: Optional[bool] = Field(default=False, description="Opt-in to store full body for privacy-conscious users")

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        channel_lower = v.lower().strip()
        if channel_lower not in ["email", "sms"]:
            raise ValueError("Channel must be either 'email' or 'sms'")
        return channel_lower

class FeatureAttribution(BaseModel):
    feature: str
    weight: float
    direction: str  # "increases_risk" or "decreases_risk"

class RuleIndicatorItem(BaseModel):
    category: str
    evidence: List[str]
    description: str

class ScanResponse(BaseModel):
    scan_id: str
    timestamp: datetime
    channel: str
    subject: Optional[str]
    body_preview: str
    risk_category: str  # "Higher Risk", "Needs Review", "Lower Risk"
    risk_score: float   # 0.0 to 1.0 (calibrated risk probability or heuristic score)
    confidence: float   # 0.0 to 1.0 (prediction certainty)
    model_used: str
    requires_review: bool
    abstained: bool
    abstain_reason: Optional[str] = None
    rule_indicators: Dict[str, Any]
    feature_attributions: List[FeatureAttribution]
    inert_urls: List[str]
    recommendations: List[str]
    safety_disclaimer: str

class ScanHistoryItem(BaseModel):
    id: str
    timestamp: datetime
    channel: str
    subject: Optional[str]
    body_preview: str
    risk_category: str
    risk_score: float
    confidence: float
    model_used: str
    requires_review: bool
    stored_full_body: bool

class ScanListResponse(BaseModel):
    items: List[ScanHistoryItem]
    total: int
    page: int
    limit: int

class ScanDetailResponse(ScanResponse):
    stored_full_body: bool
    full_body: Optional[str] = None

class DashboardSummary(BaseModel):
    total_scans: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    needs_review_count: int
    risk_distribution: List[Dict[str, Any]]
    recent_scans: List[ScanHistoryItem]
    model_performance_summary: Dict[str, Any]
    educational_notice: str

class ModelMetadataResponse(BaseModel):
    training_timestamp: str
    model_version: str
    train_samples_count: int
    validation_samples_count: int
    vocabulary_size: int
    models: Dict[str, Any]

class UserSettingsSchema(BaseModel):
    default_model: str
    high_risk_threshold: float
    low_risk_threshold: float
    store_message_body_default: bool

class SettingsUpdateSchema(BaseModel):
    default_model: Optional[str] = None
    high_risk_threshold: Optional[float] = Field(None, ge=0.50, le=0.95)
    low_risk_threshold: Optional[float] = Field(None, ge=0.05, le=0.50)
    store_message_body_default: Optional[bool] = None

    @field_validator("low_risk_threshold")
    @classmethod
    def validate_thresholds(cls, v: Optional[float], values) -> Optional[float]:
        # Cross validation when both are present
        return v
