import os
import io
import json
from datetime import datetime, timedelta
import random
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
import pandas as pd

from backend.database import get_db, init_db, DB_FILE
from backend.ml_engine import ml_engine, BASELINES

# Initialize FastAPI app
app = FastAPI(
    title="OptiMach AI API",
    description="Intelligent Industrial Predictive Maintenance & Machine Health Monitoring Platform API",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (and any origin for local execution)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure DB is initialized on startup
@app.on_event("startup")
def startup_event():
    init_db()

# --- Pydantic Schemas ---
class PredictionRequest(BaseModel):
    volt: float = Field(..., description="Voltage in Volts")
    rotate: float = Field(..., description="Rotational speed in RPM")
    pressure: float = Field(..., description="Pressure in psi")
    vibration: float = Field(..., description="Vibration velocity in mm/s")
    model_type: Optional[str] = Field("random_forest", description="ML model to use")
    machine_id: Optional[str] = Field("MCH-EXP", description="Machine identifier")

class MachineCreate(BaseModel):
    id: str
    name: str
    type: str
    location: str
    age_years: int
    volt: float = 170.8
    rotate: float = 446.6
    pressure: float = 100.9
    vibration: float = 40.4

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    age_years: Optional[int] = None
    status: Optional[str] = None
    volt: Optional[float] = None
    rotate: Optional[float] = None
    pressure: Optional[float] = None
    vibration: Optional[float] = None

class MaintenanceRecordCreate(BaseModel):
    machine_id: str
    title: str
    description: str
    priority: str = "Medium" # Low, Medium, High, Urgent
    status: str = "Scheduled" # Scheduled, In Progress, Completed, Pending
    technician: str
    scheduled_date: str
    cost: Optional[float] = 0.0

class MaintenanceRecordUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    technician: Optional[str] = None
    scheduled_date: Optional[str] = None
    completed_date: Optional[str] = None
    cost: Optional[float] = None

class ReportCreate(BaseModel):
    title: str
    machine_ids: List[str]
    generated_by: str
    summary: str
    risk_summary: str

class SettingsUpdate(BaseModel):
    active_model: Optional[str] = None
    prediction_horizon_days: Optional[str] = None
    volt_min: Optional[str] = None
    volt_max: Optional[str] = None
    rotate_min: Optional[str] = None
    rotate_max: Optional[str] = None
    pressure_min: Optional[str] = None
    pressure_max: Optional[str] = None
    vibration_max: Optional[str] = None
    auto_alert_sound: Optional[str] = None
    plant_name: Optional[str] = None

# --- Health & Diagnostic Endpoints ---
@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OptiMach AI Predictive Maintenance Engine",
        "academic_title": "Design and Development of a Machine Learning-Based Predictive Maintenance System for Industrial Equipment Failure Prediction and Health Monitoring",
        "timestamp": datetime.now().isoformat(),
        "ml_engine_loaded": ml_engine.is_loaded,
        "available_models": list(ml_engine.models.keys())
    }

# --- Dashboard Statistics & Analytics ---
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM machines")
    total_machines = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'Healthy'")
    healthy_machines = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'Warning'")
    warning_machines = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'High Risk'")
    high_risk_machines = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'Critical'")
    critical_machines = cursor.fetchone()[0]

    machines_at_risk = warning_machines + high_risk_machines

    # Predicted failures within 7 days (failure_prob > 0.50)
    cursor.execute("SELECT COUNT(*) FROM machines WHERE failure_prob >= 0.50")
    predicted_failures = cursor.fetchone()[0]

    # Maintenance pending or in progress
    cursor.execute("SELECT COUNT(*) FROM maintenance_records WHERE status IN ('Scheduled', 'In Progress', 'Pending')")
    maintenance_required = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(health_score) FROM machines")
    avg_health_row = cursor.fetchone()
    avg_health_score = round(float(avg_health_row[0]), 1) if avg_health_row and avg_health_row[0] is not None else 85.0

    conn.close()

    return {
        "total_machines": total_machines,
        "healthy_machines": healthy_machines,
        "machines_at_risk": machines_at_risk,
        "warning_machines": warning_machines,
        "high_risk_machines": high_risk_machines,
        "critical_machines": critical_machines,
        "predicted_failures": predicted_failures,
        "maintenance_required": maintenance_required,
        "avg_health_score": avg_health_score,
        "health_percentage": round((healthy_machines / max(total_machines, 1)) * 100, 1)
    }

@app.get("/api/dashboard/analytics")
def get_dashboard_analytics():
    conn = get_db()
    cursor = conn.cursor()

    # Health distribution
    cursor.execute("SELECT status, COUNT(*) as count FROM machines GROUP BY status")
    health_dist_rows = cursor.fetchall()
    health_dist = [{"status": r["status"], "count": r["count"]} for r in health_dist_rows]

    # Machines list for risk comparison
    cursor.execute("SELECT id, name, type, health_score, failure_prob, status, volt, rotate, pressure, vibration FROM machines ORDER BY failure_prob DESC")
    machines_risk = [dict(r) for r in cursor.fetchall()]

    # Sensor telemetry trends (simulated chronological trend points for the past 7 days)
    now = datetime.now()
    trend_history = []
    base_v = 171.0
    base_r = 445.0
    base_p = 101.0
    base_vib = 40.5

    for d in range(7, 0, -1):
        dt = (now - timedelta(days=d)).strftime("%b %d")
        trend_history.append({
            "date": dt,
            "volt": round(base_v + (7 - d) * 1.8 + random.uniform(-2, 2), 1),
            "rotate": round(base_r - (7 - d) * 4.2 + random.uniform(-5, 5), 1),
            "pressure": round(base_p + (7 - d) * 2.1 + random.uniform(-1.5, 1.5), 1),
            "vibration": round(base_vib + (7 - d) * 1.6 + random.uniform(-1, 1), 1),
            "failure_risk_index": round(min(95, 20 + (7 - d) * 8.5 + random.uniform(-3, 3)), 1)
        })

    # Maintenance summary
    cursor.execute("SELECT status, COUNT(*) as count FROM maintenance_records GROUP BY status")
    maint_dist = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "health_distribution": health_dist,
        "machines_risk_comparison": machines_risk,
        "sensor_parameter_trends": trend_history,
        "maintenance_distribution": maint_dist
    }

# --- Machine Management Endpoints ---
@app.get("/api/machines")
def get_machines(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("health_score"),
    order: Optional[str] = Query("asc")
):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM machines WHERE 1=1"
    params = []

    if search:
        query += " AND (id LIKE ? OR name LIKE ? OR type LIKE ? OR location LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    valid_sorts = {
        "health_score": "health_score",
        "failure_prob": "failure_prob",
        "age_years": "age_years",
        "id": "id",
        "name": "name"
    }
    sort_column = valid_sorts.get(sort_by, "health_score")
    sort_order = "DESC" if order.lower() == "desc" else "ASC"
    query += f" ORDER BY {sort_column} {sort_order}"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    machines = [dict(r) for r in rows]
    conn.close()
    return machines

@app.get("/api/machines/{machine_id}")
def get_machine(machine_id: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM machines WHERE id = ?", (machine_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    machine = dict(row)

    # Fetch recent maintenance records for this machine
    cursor.execute("SELECT * FROM maintenance_records WHERE machine_id = ? ORDER BY id DESC", (machine_id,))
    m_records = [dict(r) for r in cursor.fetchall()]
    machine["maintenance_history"] = m_records

    # Fetch recent alerts for this machine
    cursor.execute("SELECT * FROM alerts WHERE machine_id = ? ORDER BY id DESC LIMIT 5", (machine_id,))
    alerts = [dict(r) for r in cursor.fetchall()]
    machine["recent_alerts"] = alerts

    conn.close()
    return machine

@app.post("/api/machines")
def create_machine(data: MachineCreate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM machines WHERE id = ?", (data.id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Machine with ID {data.id} already exists")

    # Predict initial health & failure risk using ML engine
    pred = ml_engine.predict_single(
        volt=data.volt,
        rotate=data.rotate,
        pressure=data.pressure,
        vibration=data.vibration,
        machine_id=data.id
    )

    now_iso = datetime.now().isoformat()
    last_maint = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO machines (id, name, type, location, age_years, status, health_score, failure_prob, last_maintenance, operating_hours, volt, rotate, pressure, vibration, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.id,
        data.name,
        data.type,
        data.location,
        data.age_years,
        pred["risk_category"],
        pred["health_score"],
        pred["failure_probability"],
        last_maint,
        100, # default initial operating hours
        data.volt,
        data.rotate,
        data.pressure,
        data.vibration,
        now_iso
    ))
    conn.commit()
    conn.close()

    return {"message": f"Machine {data.id} created successfully", "machine_id": data.id, "initial_prediction": pred}

@app.put("/api/machines/{machine_id}")
def update_machine(machine_id: str, data: MachineUpdate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM machines WHERE id = ?", (machine_id,))
    curr = cursor.fetchone()
    if not curr:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    curr_dict = dict(curr)

    new_name = data.name if data.name is not None else curr_dict["name"]
    new_type = data.type if data.type is not None else curr_dict["type"]
    new_loc = data.location if data.location is not None else curr_dict["location"]
    new_age = data.age_years if data.age_years is not None else curr_dict["age_years"]
    new_volt = data.volt if data.volt is not None else curr_dict["volt"]
    new_rot = data.rotate if data.rotate is not None else curr_dict["rotate"]
    new_p = data.pressure if data.pressure is not None else curr_dict["pressure"]
    new_vib = data.vibration if data.vibration is not None else curr_dict["vibration"]

    # If telemetry changed or status not explicitly forced, recalculate ML prediction
    pred = ml_engine.predict_single(volt=new_volt, rotate=new_rot, pressure=new_p, vibration=new_vib, machine_id=machine_id)
    new_status = data.status if data.status is not None else pred["risk_category"]
    new_health = pred["health_score"]
    new_fail_prob = pred["failure_probability"]

    cursor.execute("""
    UPDATE machines
    SET name = ?, type = ?, location = ?, age_years = ?, status = ?, health_score = ?, failure_prob = ?, volt = ?, rotate = ?, pressure = ?, vibration = ?
    WHERE id = ?
    """, (new_name, new_type, new_loc, new_age, new_status, new_health, new_fail_prob, new_volt, new_rot, new_p, new_vib, machine_id))

    conn.commit()
    conn.close()
    return {"message": f"Machine {machine_id} updated successfully"}

@app.delete("/api/machines/{machine_id}")
def delete_machine(machine_id: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM machines WHERE id = ?", (machine_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    cursor.execute("DELETE FROM maintenance_records WHERE machine_id = ?", (machine_id,))
    cursor.execute("DELETE FROM alerts WHERE machine_id = ?", (machine_id,))
    cursor.execute("DELETE FROM machines WHERE id = ?", (machine_id,))

    conn.commit()
    conn.close()
    return {"message": f"Machine {machine_id} and associated records deleted"}

# --- Predictive Maintenance AI Module ---
@app.post("/api/predict")
def predict_sensor_values(req: PredictionRequest):
    """
    Method A: Manual sensor input prediction using the trained ML model.
    """
    res = ml_engine.predict_single(
        volt=req.volt,
        rotate=req.rotate,
        pressure=req.pressure,
        vibration=req.vibration,
        model_type=req.model_type or "random_forest",
        machine_id=req.machine_id or "MCH-EXP"
    )
    return res

@app.post("/api/predict/batch")
async def predict_csv_batch(file: UploadFile = File(...), model_type: str = Form("random_forest")):
    """
    Method B: Upload CSV containing machine telemetry for batch ML inference.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a valid .csv file.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    try:
        batch_results = ml_engine.process_csv(df, model_type=model_type)
        return batch_results
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/api/predict/sample-csv")
def download_sample_csv():
    """
    Download sample telemetry CSV file for testing batch prediction.
    """
    csv_path = os.path.join(os.path.dirname(__file__), "data", "batch_test_machines.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Sample CSV not found")
    return FileResponse(
        path=csv_path,
        media_type="text/csv",
        filename="optimach_telemetry_batch_sample.csv"
    )

# --- Machine Learning Performance & Comparison Metrics ---
@app.get("/api/ml/metrics")
def get_ml_metrics():
    """
    Returns authentic training and evaluation metrics for Logistic Regression,
    Random Forest, and Gradient Boosting on Azure dataset.
    """
    metrics = ml_engine.get_metrics()
    if not metrics:
        raise HTTPException(status_code=503, detail="ML metrics not generated yet")
    return metrics

# --- Live Machine Monitoring (Simulated Telemetry Stream) ---
@app.get("/api/monitoring/live/{machine_id}")
def get_live_telemetry(machine_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machines WHERE id = ?", (machine_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    m = dict(row)

    # Generate slight realistic live jitter based on machine base telemetry
    volt_noise = random.uniform(-1.2, 1.2)
    rotate_noise = random.uniform(-3.5, 3.5)
    pressure_noise = random.uniform(-0.8, 0.8)
    vib_noise = random.uniform(-0.4, 0.4)

    live_volt = round(max(100.0, m["volt"] + volt_noise), 1)
    live_rotate = round(max(200.0, m["rotate"] + rotate_noise), 1)
    live_pressure = round(max(50.0, m["pressure"] + pressure_noise), 1)
    live_vibration = round(max(10.0, m["vibration"] + vib_noise), 1)

    # Evaluate live status
    live_pred = ml_engine.predict_single(
        volt=live_volt,
        rotate=live_rotate,
        pressure=live_pressure,
        vibration=live_vibration,
        machine_id=machine_id
    )

    # Check alert thresholds
    active_alerts = []
    if live_vibration > 46.0:
        active_alerts.append(f"Vibration Alert: {live_vibration} mm/s exceeds safety limit (46.0 mm/s)")
    if live_pressure > 115.0:
        active_alerts.append(f"Pressure Alert: {live_pressure} psi exceeds safety limit (115.0 psi)")
    if live_volt > 185.0 or live_volt < 155.0:
        active_alerts.append(f"Voltage Deviation: {live_volt} V outside continuous operating band")

    return {
        "machine_id": machine_id,
        "machine_name": m["name"],
        "machine_type": m["type"],
        "timestamp": datetime.now().isoformat(),
        "readings": {
            "volt": live_volt,
            "rotate": live_rotate,
            "pressure": live_pressure,
            "vibration": live_vibration
        },
        "health_score": live_pred["health_score"],
        "risk_category": live_pred["risk_category"],
        "failure_probability": live_pred["failure_probability"],
        "threshold_alerts": active_alerts,
        "is_simulated": True
    }

# --- AI Maintenance Recommendations ---
@app.get("/api/recommendations/{machine_id}")
def get_machine_recommendations(machine_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machines WHERE id = ?", (machine_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    m = dict(row)
    pred = ml_engine.predict_single(
        volt=m["volt"],
        rotate=m["rotate"],
        pressure=m["pressure"],
        vibration=m["vibration"],
        machine_id=machine_id
    )

    return {
        "machine_id": machine_id,
        "machine_name": m["name"],
        "machine_type": m["type"],
        "location": m["location"],
        "last_maintenance": m["last_maintenance"],
        "prediction_summary": pred
    }

# --- Maintenance Management Endpoints ---
@app.get("/api/maintenance")
def get_maintenance_records(status: Optional[str] = Query(None), machine_id: Optional[str] = Query(None)):
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT mr.*, m.name as machine_name, m.type as machine_type
    FROM maintenance_records mr
    LEFT JOIN machines m ON mr.machine_id = m.id
    WHERE 1=1
    """
    params = []

    if status and status != "All":
        query += " AND mr.status = ?"
        params.append(status)

    if machine_id:
        query += " AND mr.machine_id = ?"
        params.append(machine_id)

    query += " ORDER BY mr.id DESC"
    cursor.execute(query, params)
    records = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return records

@app.post("/api/maintenance")
def create_maintenance_record(rec: MaintenanceRecordCreate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO maintenance_records (machine_id, title, description, priority, status, technician, scheduled_date, completed_date, cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
    """, (rec.machine_id, rec.title, rec.description, rec.priority, rec.status, rec.technician, rec.scheduled_date, rec.cost or 0.0))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Maintenance record created", "id": new_id}

@app.put("/api/maintenance/{record_id}")
def update_maintenance_record(record_id: int, rec: MaintenanceRecordUpdate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM maintenance_records WHERE id = ?", (record_id,))
    curr = cursor.fetchone()
    if not curr:
        conn.close()
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    curr_dict = dict(curr)

    new_title = rec.title if rec.title is not None else curr_dict["title"]
    new_desc = rec.description if rec.description is not None else curr_dict["description"]
    new_prio = rec.priority if rec.priority is not None else curr_dict["priority"]
    new_status = rec.status if rec.status is not None else curr_dict["status"]
    new_tech = rec.technician if rec.technician is not None else curr_dict["technician"]
    new_sch = rec.scheduled_date if rec.scheduled_date is not None else curr_dict["scheduled_date"]
    new_comp = rec.completed_date if rec.completed_date is not None else curr_dict["completed_date"]
    new_cost = rec.cost if rec.cost is not None else curr_dict["cost"]

    # If marked completed and completed_date not supplied, auto-set today
    if new_status == "Completed" and not new_comp:
        new_comp = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
    UPDATE maintenance_records
    SET title = ?, description = ?, priority = ?, status = ?, technician = ?, scheduled_date = ?, completed_date = ?, cost = ?
    WHERE id = ?
    """, (new_title, new_desc, new_prio, new_status, new_tech, new_sch, new_comp, new_cost, record_id))

    conn.commit()
    conn.close()
    return {"message": "Maintenance record updated"}

@app.delete("/api/maintenance/{record_id}")
def delete_maintenance_record(record_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM maintenance_records WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return {"message": "Maintenance record deleted"}

# --- Reports Module ---
@app.post("/api/reports/generate")
def save_generated_report(data: ReportCreate):
    conn = get_db()
    cursor = conn.cursor()

    report_code = f"RPT-{datetime.now().strftime('%Y%m%d')}-{random.randint(100, 999)}"
    now_iso = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO reports (report_id, title, machine_ids, generated_by, summary, risk_summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        report_code,
        data.title,
        json.dumps(data.machine_ids),
        data.generated_by,
        data.summary,
        data.risk_summary,
        now_iso
    ))

    conn.commit()
    conn.close()
    return {"message": "Report record saved", "report_id": report_code}

@app.get("/api/reports/history")
def get_reports_history():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports ORDER BY id DESC")
    rows = cursor.fetchall()
    reports = []
    for r in rows:
        d = dict(r)
        try:
            d["machine_ids"] = json.loads(d["machine_ids"])
        except Exception:
            d["machine_ids"] = []
        reports.append(d)
    conn.close()
    return reports

# --- Alerts & Notifications ---
@app.get("/api/alerts")
def get_alerts(unread_only: bool = False):
    conn = get_db()
    cursor = conn.cursor()
    if unread_only:
        cursor.execute("SELECT * FROM alerts WHERE read = 0 ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
    alerts = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return alerts

@app.post("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET read = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"message": "Alert marked as read"}

@app.post("/api/alerts/clear-all")
def clear_all_alerts():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET read = 1")
    conn.commit()
    conn.close()
    return {"message": "All alerts marked as read"}

# --- Settings ---
@app.get("/api/settings")
def get_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    settings_dict = {r["key"]: r["value"] for r in rows}
    conn.close()
    return settings_dict

@app.post("/api/settings")
def update_settings(data: SettingsUpdate):
    conn = get_db()
    cursor = conn.cursor()

    updates = data.dict(exclude_unset=True)
    for k, v in updates.items():
        if v is not None:
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))

    conn.commit()
    conn.close()
    return {"message": "Settings updated successfully"}

# --- Seed Reset ---
@app.post("/api/seed/reset")
def reset_seed():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    init_db()
    return {"message": "Database successfully reset to initial plant state"}

# --- Static Frontend Delivery (Production & Render) ---
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def index_fallback():
        return {
            "service": "OptiMach AI API",
            "status": "online",
            "docs_url": "/docs",
            "health_url": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)

