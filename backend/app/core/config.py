"""
Application configuration for PhishShift Backend.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

class Settings:
    APP_NAME: str = "PhishShift API"
    APP_VERSION: str = "1.0.0-ml07"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_HOST: str = os.getenv("APP_HOST", "127.0.0.1")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
        if origin.strip()
    ]

    # Database
    DATABASE_PATH: Path = BASE_DIR / "phishshift.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")

    # ML Paths
    ML_DIR: Path = WORKSPACE_DIR / "ml"
    ARTIFACTS_DIR: Path = ML_DIR / "artifacts"
    REPORTS_DIR: Path = ML_DIR / "reports"
    DATA_PROCESSED_DIR: Path = WORKSPACE_DIR / "data" / "processed"

    # Default thresholds & model
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "linear_svm")
    DEFAULT_HIGH_RISK_THRESHOLD: float = float(os.getenv("DEFAULT_HIGH_RISK_THRESHOLD", "0.70"))
    DEFAULT_LOW_RISK_THRESHOLD: float = float(os.getenv("DEFAULT_LOW_RISK_THRESHOLD", "0.40"))
    STORE_MESSAGE_BODY_DEFAULT: bool = os.getenv("STORE_MESSAGE_BODY_DEFAULT", "false").lower() == "true"
    MAX_MESSAGE_LENGTH: int = int(os.getenv("MAX_MESSAGE_LENGTH", "10000"))

settings = Settings()
