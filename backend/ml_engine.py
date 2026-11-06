import os
import json
import numpy as np
import pandas as pd
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Baseline nominal operating parameters for industrial equipment (Azure Benchmark)
BASELINES = {
    "volt": {"mean": 170.8, "std": 14.5, "unit": "V", "label": "Voltage", "safe_min": 155.0, "safe_max": 182.0},
    "rotate": {"mean": 446.6, "std": 48.2, "unit": "RPM", "label": "Rotation Speed", "safe_min": 420.0, "safe_max": 475.0},
    "pressure": {"mean": 100.9, "std": 10.5, "unit": "psi", "label": "Fluid Pressure", "safe_min": 90.0, "safe_max": 112.0},
    "vibration": {"mean": 40.4, "std": 5.1, "unit": "mm/s", "label": "Vibration Velocity", "safe_min": 35.0, "safe_max": 44.5},
}

class MLEngine:
    def __init__(self):
        self.models = {}
        self.scaler = None
        self.metrics = None
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)

            for key in ["random_forest", "gradient_boosting", "logistic_regression"]:
                model_path = os.path.join(MODELS_DIR, f"{key}.joblib")
                if os.path.exists(model_path):
                    self.models[key] = joblib.load(model_path)

            metrics_path = os.path.join(MODELS_DIR, "metrics.json")
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    self.metrics = json.load(f)

            self.is_loaded = (len(self.models) > 0 and self.scaler is not None)
            print(f"ML Engine loaded. Available models: {list(self.models.keys())}")
        except Exception as e:
            print(f"Error loading ML models: {e}")
            self.is_loaded = False

    def get_metrics(self):
        return self.metrics

    def predict_single(self, volt: float, rotate: float, pressure: float, vibration: float, model_type: str = "random_forest", machine_id: str = "MCH-EXP"):
        model_key = model_type.lower()
        if model_key not in self.models:
            model_key = "random_forest" if "random_forest" in self.models else list(self.models.keys())[0]

        clf = self.models[model_key]
        features = pd.DataFrame([[volt, rotate, pressure, vibration]], columns=["volt", "rotate", "pressure", "vibration"])

        if model_key == "logistic_regression" and self.scaler is not None:
            features_input = self.scaler.transform(features)
        else:
            features_input = features

        # Predict probability
        probs = clf.predict_proba(features_input)[0]
        failure_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])

        # Risk categorization
        if failure_prob >= 0.75:
            risk_category = "Critical"
            status_color = "#EF4444" # red
        elif failure_prob >= 0.50:
            risk_category = "High Risk"
            status_color = "#F97316" # orange
        elif failure_prob >= 0.25:
            risk_category = "Warning"
            status_color = "#F59E0B" # yellow/amber
        else:
            risk_category = "Healthy"
            status_color = "#10B981" # green

        # Health score
        health_score = round(max(4.0, min(99.8, (1.0 - failure_prob) * 100)), 1)

        # Contributing factor analysis
        contributing_factors = []
        raw_vals = {"volt": volt, "rotate": rotate, "pressure": pressure, "vibration": vibration}

        for k, info in BASELINES.items():
            val = raw_vals[k]
            z_score = abs(val - info["mean"]) / info["std"]
            is_high = val > info["safe_max"]
            is_low = val < info["safe_min"]
            deviation_pct = round(((val - info["mean"]) / info["mean"]) * 100, 1)

            severity = "Normal"
            if z_score > 2.5:
                severity = "Critical"
            elif z_score > 1.4:
                severity = "High"
            elif z_score > 0.8:
                severity = "Moderate"

            contributing_factors.append({
                "feature": k,
                "label": info["label"],
                "value": round(val, 2),
                "unit": info["unit"],
                "baseline_mean": info["mean"],
                "safe_range": f"{info['safe_min']} - {info['safe_max']} {info['unit']}",
                "deviation_pct": deviation_pct,
                "z_score": round(float(z_score), 2),
                "severity": severity,
                "is_out_of_bounds": is_high or is_low
            })

        # Sort factors by impact (z-score) descending
        contributing_factors.sort(key=lambda x: x["z_score"], reverse=True)

        # Recommendations based on actual factors
        recommendations = self.generate_recommendations(raw_vals, failure_prob, risk_category, contributing_factors)

        return {
            "machine_id": machine_id,
            "model_used": model_key,
            "model_name": self.metrics["models"].get(model_key, {}).get("name", model_key) if self.metrics else model_key,
            "failure_probability": round(failure_prob, 4),
            "failure_probability_pct": round(failure_prob * 100, 1),
            "health_score": health_score,
            "risk_category": risk_category,
            "status_color": status_color,
            "prediction_horizon": "7 Days",
            "is_demo_mode": not self.is_loaded,
            "contributing_factors": contributing_factors,
            "recommendations": recommendations,
            "telemetry": {
                "volt": volt,
                "rotate": rotate,
                "pressure": pressure,
                "vibration": vibration
            }
        }

    def generate_recommendations(self, telemetry: dict, prob: float, risk_category: str, factors: list):
        signs = []
        abnormal = []
        issues = []
        actions = []

        v = telemetry["volt"]
        r = telemetry["rotate"]
        p = telemetry["pressure"]
        vib = telemetry["vibration"]

        # Vibration analysis
        if vib > 45.0:
            abnormal.append(f"Vibration velocity at {vib:.1f} mm/s exceeds ISO 10816 Class II threshold (44.5 mm/s)")
            if vib > 52.0:
                signs.append("Extreme harmonic resonance and mechanical knocking detected in drive assembly")
                issues.append("Severe rolling element bearing spalling or rotor imbalance")
                actions.append("Perform emergency laser vibration spectrum analysis and inspect drive shaft bearings")
            else:
                signs.append("Elevated mechanical vibration detected")
                issues.append("Initial drive coupling wear or shaft misalignment")
                actions.append("Schedule vibration check and lubricate bearing assemblies")

        # Pressure analysis
        if p > 112.0:
            abnormal.append(f"Fluid/manifold pressure at {p:.1f} psi exceeds nominal ceiling (112.0 psi)")
            signs.append("Internal fluid pressure surge observed")
            issues.append("Discharge valve constriction, clogged filter element, or hydraulic backpressure")
            actions.append("Inspect intake/exhaust pressure relief valves and replace fluid line filters")
        elif p < 88.0:
            abnormal.append(f"Under-pressure condition detected ({p:.1f} psi)")
            signs.append("Pressure loss in hydraulic circuit")
            issues.append("Cavitation, suction line seal leakage, or pump priming degradation")
            actions.append("Verify suction line integrity and inspect mechanical face seals")

        # Rotation analysis
        if r < 415.0:
            abnormal.append(f"Shaft RPM reduced to {r:.1f} RPM below continuous rating (420 RPM)")
            signs.append("Mechanical torque resistance or slip in transmission")
            issues.append("Transmission belt slippage, gear train binding, or excessive load torque")
            actions.append("Check belt tension, inspect gearbox oil viscosity, and test motor stator currents")

        # Voltage analysis
        if v > 182.0:
            abnormal.append(f"Supply voltage surge to {v:.1f} V (Nominal rating: 170.8 V)")
            signs.append("Mains line voltage spikes detected")
            issues.append("VFD inverter switching transients or grid phase imbalance")
            actions.append("Test VFD harmonic filters and measure phase-to-phase electrical balance")
        elif v < 155.0:
            abnormal.append(f"Voltage drop to {v:.1f} V (Risk of brownout slip)")
            signs.append("Inadequate terminal voltage")
            issues.append("High impedance contact resistance or line sag")
            actions.append("Tighten terminal busbars and verify power supply distribution unit")

        # Fallback if within bounds
        if not abnormal:
            signs.append("All measured telemetry parameters operating within nominal statistical tolerances")
            issues.append("No active mechanical or electrical defects identified")
            actions.append("Continue standard preventive maintenance schedule and continuous IoT telemetry logging")
            priority = "Low"
            suggested_schedule = "Next scheduled routine inspection (30 days)"
        else:
            if risk_category == "Critical":
                priority = "Urgent"
                suggested_schedule = "Immediate action required within 24-48 hours"
            elif risk_category == "High Risk":
                priority = "High"
                suggested_schedule = "Schedule service within 3 to 5 business days"
            elif risk_category == "Warning":
                priority = "Medium"
                suggested_schedule = "Perform maintenance check within 7 to 10 days"
            else:
                priority = "Low"
                suggested_schedule = "Next routine maintenance window"

        return {
            "warning_signs": signs,
            "abnormal_parameters": abnormal,
            "possible_issues": issues,
            "recommended_actions": actions,
            "maintenance_priority": priority,
            "suggested_schedule": suggested_schedule
        }

    def process_csv(self, df: pd.DataFrame, model_type: str = "random_forest"):
        required_cols = ["volt", "rotate", "pressure", "vibration"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required sensor column: '{col}'. Expected columns: volt, rotate, pressure, vibration")

        results = []
        for idx, row in df.iterrows():
            m_id = str(row.get("machine_id", f"MCH-{idx+1:03d}"))
            res = self.predict_single(
                volt=float(row["volt"]),
                rotate=float(row["rotate"]),
                pressure=float(row["pressure"]),
                vibration=float(row["vibration"]),
                model_type=model_type,
                machine_id=m_id
            )
            results.append(res)

        # Batch summary statistics
        total = len(results)
        critical_count = sum(1 for r in results if r["risk_category"] == "Critical")
        high_risk_count = sum(1 for r in results if r["risk_category"] == "High Risk")
        warning_count = sum(1 for r in results if r["risk_category"] == "Warning")
        healthy_count = sum(1 for r in results if r["risk_category"] == "Healthy")
        avg_health = round(sum(r["health_score"] for r in results) / max(total, 1), 1)

        return {
            "total_processed": total,
            "summary": {
                "healthy": healthy_count,
                "warning": warning_count,
                "high_risk": high_risk_count,
                "critical": critical_count,
                "average_health_score": avg_health,
                "critical_pct": round((critical_count / total) * 100, 1) if total > 0 else 0
            },
            "records": results
        }

ml_engine = MLEngine()
