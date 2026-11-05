"""
SQLAlchemy ORM models for scan history and user settings.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer
from app.database.session import Base

class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    channel = Column(String(16), default="email", index=True)  # email, sms
    subject = Column(String(256), nullable=True)
    body_preview = Column(String(280), nullable=False)
    stored_full_body = Column(Boolean, default=False)
    full_body = Column(Text, nullable=True)
    
    # Prediction and Risk Assessment
    risk_category = Column(String(32), index=True)  # Higher Risk, Needs Review, Lower Risk
    risk_score = Column(Float, nullable=False)       # 0.0 to 1.0
    confidence = Column(Float, nullable=False)       # 0.0 to 1.0
    model_used = Column(String(64), nullable=False)
    requires_review = Column(Boolean, default=False)
    abstained = Column(Boolean, default=False)
    
    # JSON-encoded details
    rule_indicators_json = Column(Text, default="{}")
    top_features_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True)
    default_model = Column(String(64), default="linear_svm")
    high_risk_threshold = Column(Float, default=0.70)
    low_risk_threshold = Column(Float, default=0.40)
    store_message_body_default = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
