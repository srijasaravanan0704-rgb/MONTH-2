"""
Scan Management and History Service with Privacy-Safe Defaults.
"""

import csv
import io
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.models import ScanRecord, UserSettings
from app.schemas.scan import ScanRequest, ScanResponse, FeatureAttribution
from app.services.ml_service import ml_service

class ScanService:
    def get_or_create_settings(self, db: Session) -> UserSettings:
        settings_row = db.query(UserSettings).first()
        if not settings_row:
            settings_row = UserSettings(
                default_model="linear_svm",
                high_risk_threshold=0.70,
                low_risk_threshold=0.40,
                store_message_body_default=False
            )
            db.add(settings_row)
            db.commit()
            db.refresh(settings_row)
        return settings_row

    def execute_scan(self, db: Session, req: ScanRequest) -> ScanResponse:
        settings_row = self.get_or_create_settings(db)
        
        # Effective model and thresholds
        model_name = req.model_name or settings_row.default_model
        high_threshold = settings_row.high_risk_threshold
        low_threshold = settings_row.low_risk_threshold

        # Combine subject and body for text analysis
        full_text = f"{req.subject or ''} {req.body}".strip()
        
        # Run ML risk evaluation
        analysis = ml_service.analyze_message(
            text=full_text,
            channel=req.channel,
            model_name=model_name,
            high_threshold=high_threshold,
            low_threshold=low_threshold
        )

        scan_id = f"SCAN-{uuid.uuid4().hex[:10].upper()}"
        body_preview = req.body[:180] + ("..." if len(req.body) > 180 else "")

        # Privacy logic: store full body ONLY if user explicitly checked store_body OR settings default is on
        should_store_body = req.store_body if req.store_body is not None else settings_row.store_message_body_default
        stored_body_text = req.body if should_store_body else None

        record = ScanRecord(
            id=scan_id,
            timestamp=datetime.utcnow(),
            channel=req.channel,
            subject=req.subject,
            body_preview=body_preview,
            stored_full_body=should_store_body,
            full_body=stored_body_text,
            risk_category=analysis["risk_category"],
            risk_score=analysis["risk_score"],
            confidence=analysis["confidence"],
            model_used=analysis["model_used"],
            requires_review=analysis["requires_review"],
            abstained=analysis["abstained"],
            rule_indicators_json=json.dumps(analysis["rule_indicators"]),
            top_features_json=json.dumps(analysis["feature_attributions"]),
            recommendations_json=json.dumps(analysis["recommendations"])
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        feature_attrs = [
            FeatureAttribution(
                feature=f["feature"],
                weight=f["weight"],
                direction=f["direction"]
            )
            for f in analysis["feature_attributions"]
        ]

        return ScanResponse(
            scan_id=record.id,
            timestamp=record.timestamp,
            channel=record.channel,
            subject=record.subject,
            body_preview=record.body_preview,
            risk_category=record.risk_category,
            risk_score=record.risk_score,
            confidence=record.confidence,
            model_used=record.model_used,
            requires_review=record.requires_review,
            abstained=record.abstained,
            abstain_reason=analysis.get("abstain_reason"),
            rule_indicators=analysis["rule_indicators"],
            feature_attributions=feature_attrs,
            inert_urls=analysis["inert_urls"],
            recommendations=analysis["recommendations"],
            safety_disclaimer=analysis["safety_disclaimer"]
        )

    def get_scans(
        self,
        db: Session,
        page: int = 1,
        limit: int = 10,
        channel: Optional[str] = None,
        risk_category: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> Tuple[List[ScanRecord], int]:
        query = db.query(ScanRecord)

        if channel and channel.lower() != "all":
            query = query.filter(ScanRecord.channel == channel.lower())

        if risk_category and risk_category.lower() != "all":
            query = query.filter(ScanRecord.risk_category == risk_category)

        if search_query:
            q = f"%{search_query.strip()}%"
            query = query.filter(
                (ScanRecord.id.ilike(q)) |
                (ScanRecord.subject.ilike(q)) |
                (ScanRecord.body_preview.ilike(q))
            )

        total = query.count()
        offset = (page - 1) * limit
        records = query.order_by(desc(ScanRecord.timestamp)).offset(offset).limit(limit).all()

        return records, total

    def get_scan_by_id(self, db: Session, scan_id: str) -> Optional[ScanRecord]:
        return db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()

    def delete_scan(self, db: Session, scan_id: str) -> bool:
        record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    def clear_all_scans(self, db: Session) -> int:
        count = db.query(ScanRecord).delete()
        db.commit()
        return count

    def export_scans_csv(self, db: Session) -> str:
        records = db.query(ScanRecord).order_by(desc(ScanRecord.timestamp)).all()
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "scan_id", "timestamp_utc", "channel", "subject",
            "body_preview", "risk_category", "risk_score",
            "confidence", "model_used", "requires_review", "stored_full_body"
        ])

        for r in records:
            writer.writerow([
                r.id,
                r.timestamp.isoformat() if r.timestamp else "",
                r.channel,
                r.subject or "",
                r.body_preview,
                r.risk_category,
                f"{r.risk_score:.4f}",
                f"{r.confidence:.4f}",
                r.model_used,
                "yes" if r.requires_review else "no",
                "yes" if r.stored_full_body else "no"
            ])

        return output.getvalue()

    def get_dashboard_summary(self, db: Session) -> Dict[str, Any]:
        total_scans = db.query(ScanRecord).count()
        high_risk_count = db.query(ScanRecord).filter(ScanRecord.risk_category == "Higher Risk").count()
        medium_risk_count = db.query(ScanRecord).filter(ScanRecord.risk_category == "Needs Review").count()
        low_risk_count = db.query(ScanRecord).filter(ScanRecord.risk_category == "Lower Risk").count()
        needs_review_count = db.query(ScanRecord).filter(ScanRecord.requires_review == True).count()

        risk_distribution = [
            {"category": "Higher Risk", "count": high_risk_count, "color": "#EF4444"},
            {"category": "Needs Review", "count": medium_risk_count, "color": "#F59E0B"},
            {"category": "Lower Risk", "count": low_risk_count, "color": "#10B981"}
        ]

        recent_records = db.query(ScanRecord).order_by(desc(ScanRecord.timestamp)).limit(5).all()
        
        # Performance summary directly from saved evaluation reports
        eval_reports = ml_service.get_evaluation_reports()
        models_eval = eval_reports.get("models_evaluation", {})

        return {
            "total_scans": total_scans,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "needs_review_count": needs_review_count,
            "risk_distribution": risk_distribution,
            "recent_scans": [
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
                for r in recent_records
            ],
            "model_performance_summary": models_eval,
            "educational_notice": "PhishShift is an educational security assistance tool designed to help users identify deceptive patterns. Automated triage cannot guarantee complete immunity against emerging spear-phishing campaigns."
        }

scan_service = ScanService()
