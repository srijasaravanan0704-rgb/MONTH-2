"""
REST API Endpoints for PhishShift.
"""

import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.scan import (
    ScanRequest,
    ScanResponse,
    ScanListResponse,
    ScanDetailResponse,
    DashboardSummary,
    UserSettingsSchema,
    SettingsUpdateSchema
)
from app.services.scan_service import scan_service
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api")

@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "PhishShift API",
        "version": "1.0.0-ml07",
        "models_loaded": ml_service.is_loaded
    }

@router.get("/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = scan_service.get_dashboard_summary(db)
    return summary

@router.post("/scan", response_model=ScanResponse, tags=["Scanner"])
def scan_message(request: ScanRequest, db: Session = Depends(get_db)):
    if len(request.body.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message body must contain at least 3 non-whitespace characters."
        )
    return scan_service.execute_scan(db, request)

@router.get("/scans", response_model=ScanListResponse, tags=["Scan History"])
def get_scans(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    channel: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    records, total = scan_service.get_scans(
        db,
        page=page,
        limit=limit,
        channel=channel,
        risk_category=risk_category,
        search_query=search
    )
    items = [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "channel": r.channel,
            "subject": r.subject,
            "body_preview": r.body_preview,
            "risk_category": r.risk_category,
            "risk_score": r.risk_score,
            "confidence": r.confidence,
            "model_used": r.model_used,
            "requires_review": r.requires_review,
            "stored_full_body": r.stored_full_body
        }
        for r in records
    ]
    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/scans/export", tags=["Scan History"])
def export_scans_csv(db: Session = Depends(get_db)):
    csv_content = scan_service.export_scans_csv(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=phishshift_scan_history.csv"}
    )

@router.get("/scans/{scan_id}", response_model=ScanDetailResponse, tags=["Scan History"])
def get_scan_detail(scan_id: str, db: Session = Depends(get_db)):
    record = scan_service.get_scan_by_id(db, scan_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Scan with ID '{scan_id}' not found.")

    rule_indicators = json.loads(record.rule_indicators_json) if record.rule_indicators_json else {}
    top_features = json.loads(record.top_features_json) if record.top_features_json else []
    recommendations = json.loads(record.recommendations_json) if record.recommendations_json else []

    return {
        "scan_id": record.id,
        "timestamp": record.timestamp,
        "channel": record.channel,
        "subject": record.subject,
        "body_preview": record.body_preview,
        "risk_category": record.risk_category,
        "risk_score": record.risk_score,
        "confidence": record.confidence,
        "model_used": record.model_used,
        "requires_review": record.requires_review,
        "abstained": record.abstained,
        "abstain_reason": "Out of scope or low token count" if record.abstained else None,
        "rule_indicators": rule_indicators,
        "feature_attributions": top_features,
        "inert_urls": ml_service.extract_inert_urls(record.full_body or record.body_preview),
        "recommendations": recommendations,
        "safety_disclaimer": "PhishShift provides educational triage decision support and cannot guarantee a message is safe.",
        "stored_full_body": record.stored_full_body,
        "full_body": record.full_body
    }

@router.delete("/scans/{scan_id}", tags=["Scan History"])
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    success = scan_service.delete_scan(db, scan_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Scan record '{scan_id}' not found.")
    return {"message": f"Scan record '{scan_id}' deleted successfully."}

@router.delete("/scans", tags=["Scan History"])
def clear_all_scans(db: Session = Depends(get_db)):
    deleted_count = scan_service.clear_all_scans(db)
    return {"message": f"Successfully cleared {deleted_count} scan records."}

@router.get("/models", tags=["Models"])
def get_models():
    return ml_service.get_available_models()

@router.get("/models/metrics", tags=["Models"])
def get_model_metrics():
    return ml_service.get_evaluation_reports()

@router.get("/experiments", tags=["Models"])
def get_experiments():
    return ml_service.model_metadata

@router.get("/robustness/results", tags=["Robustness"])
def get_robustness_results():
    return ml_service.get_robustness_reports()

@router.get("/settings", response_model=UserSettingsSchema, tags=["Settings"])
def get_settings(db: Session = Depends(get_db)):
    s = scan_service.get_or_create_settings(db)
    return {
        "default_model": s.default_model,
        "high_risk_threshold": s.high_risk_threshold,
        "low_risk_threshold": s.low_risk_threshold,
        "store_message_body_default": s.store_message_body_default
    }

@router.post("/settings", response_model=UserSettingsSchema, tags=["Settings"])
def update_settings(update: SettingsUpdateSchema, db: Session = Depends(get_db)):
    s = scan_service.get_or_create_settings(db)
    
    if update.default_model is not None:
        if update.default_model not in [m["id"] for m in ml_service.get_available_models()]:
            raise HTTPException(status_code=400, detail="Invalid model identifier.")
        s.default_model = update.default_model

    if update.high_risk_threshold is not None:
        s.high_risk_threshold = update.high_risk_threshold

    if update.low_risk_threshold is not None:
        s.low_risk_threshold = update.low_risk_threshold

    if s.low_risk_threshold >= s.high_risk_threshold:
        raise HTTPException(status_code=400, detail="Low risk threshold must be strictly less than high risk threshold.")

    if update.store_message_body_default is not None:
        s.store_message_body_default = update.store_message_body_default

    db.commit()
    db.refresh(s)

    return {
        "default_model": s.default_model,
        "high_risk_threshold": s.high_risk_threshold,
        "low_risk_threshold": s.low_risk_threshold,
        "store_message_body_default": s.store_message_body_default
    }

@router.get("/samples", tags=["Scanner"])
def get_educational_samples():
    """Educational sample presets for quick scanning demonstrations."""
    return [
        {
            "id": "sample_phish_email_m365",
            "name": "M365 Urgent Password Expiration",
            "channel": "email",
            "category": "phishing",
            "subject": "CRITICAL: Your Microsoft 365 Password Expires in 24 Hours",
            "body": "Dear User,\n\nYour Microsoft 365 password is scheduled to expire in 24 hours. To prevent suspension of your email services and cloud access, please verify your credentials immediately.\n\nKeep Same Password: hxxps[://]login-microsoft365-verify[.]net/auth/portal\n\nFailure to take action will result in mailbox deactivation.\n\nIT Support Desk"
        },
        {
            "id": "sample_phish_email_bec",
            "name": "CEO Confidential Wire Request",
            "channel": "email",
            "category": "phishing",
            "subject": "CONFIDENTIAL: Urgent Wire Transfer for Acquisition",
            "body": "Hi, are you at your desk?\n\nI need you to process an urgent wire transfer for an acquisition closing today. Keep this strictly confidential as the board has not made an announcement. Let me know what information you require to expedite this before 3 PM cutoff.\n\nSent from my iPhone\nChief Executive Officer"
        },
        {
            "id": "sample_phish_sms_package",
            "name": "USPS Smishing Delivery Redirection",
            "channel": "sms",
            "category": "phishing",
            "subject": "SMS Notification",
            "body": "USPS Alert: Your parcel #94001092023 cannot be delivered due to incomplete street number. Update address within 12h: hxxps[://]usps-tracking-redelivery[.]info/p?id=9400109"
        },
        {
            "id": "sample_benign_email_pw_reset",
            "name": "Legitimate Password Reset (Google)",
            "channel": "email",
            "category": "benign",
            "subject": "Reset your Google Workspace password",
            "body": "Hi Alex,\n\nWe received a request to reset your password for your corporate Google Workspace account. If you made this request, please use the following link to choose a new password:\n\nhxxps[://]accounts[.]google[.]com/signin/recovery\n\nThis link is valid for 15 minutes. If you did not request this, you can safely ignore this email; your password will remain unchanged.\n\nGoogle Workspace Team"
        },
        {
            "id": "sample_benign_email_payroll",
            "name": "Legitimate ADP Paystub Notice",
            "channel": "email",
            "category": "benign",
            "subject": "Your bi-weekly earnings statement is available in ADP",
            "body": "Dear Team Member,\n\nYour bi-weekly direct deposit earnings statement for pay period ending October 15, 2026 is now available. Log in to your ADP Workforce Now account to review pay and tax withholdings:\n\nhxxps[://]workforcenow[.]adp[.]com\n\nPlease reach out to payroll@company.internal if you have any questions.\n\nPayroll & HR Shared Services"
        },
        {
            "id": "sample_benign_sms_dental",
            "name": "Legitimate Dental Appointment SMS",
            "channel": "sms",
            "category": "benign",
            "subject": "SMS Notification",
            "body": "Your Dr. Patel dental checkup appointment is confirmed for Tuesday, Oct 21 at 2:30 PM. Reply 1 to Confirm or 2 to Reschedule."
        }
    ]
