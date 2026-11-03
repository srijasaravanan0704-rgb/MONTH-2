import os
import json
import sqlite3
from datetime import datetime, timedelta
import random

DB_FILE = os.path.join(os.path.dirname(__file__), "optimach.db")

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Machines table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        location TEXT NOT NULL,
        age_years INTEGER NOT NULL,
        status TEXT NOT NULL, -- Healthy, Warning, High Risk, Critical
        health_score REAL NOT NULL,
        failure_prob REAL NOT NULL,
        last_maintenance TEXT NOT NULL,
        operating_hours INTEGER NOT NULL,
        volt REAL NOT NULL,
        rotate REAL NOT NULL,
        pressure REAL NOT NULL,
        vibration REAL NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Maintenance records table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL, -- Low, Medium, High, Urgent
        status TEXT NOT NULL, -- Scheduled, In Progress, Completed, Pending
        technician TEXT NOT NULL,
        scheduled_date TEXT NOT NULL,
        completed_date TEXT,
        cost REAL DEFAULT 0.0,
        FOREIGN KEY (machine_id) REFERENCES machines(id)
    )
    """)

    # Alert logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        type TEXT NOT NULL, -- Warning, Critical, Maintenance, Info
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (machine_id) REFERENCES machines(id)
    )
    """)

    # Reports history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL,
        title TEXT NOT NULL,
        machine_ids TEXT NOT NULL,
        generated_by TEXT NOT NULL,
        summary TEXT NOT NULL,
        risk_summary TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # User settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    conn.commit()

    # Check if machines need initial seeding
    cursor.execute("SELECT COUNT(*) FROM machines")
    count = cursor.fetchone()[0]

    if count == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()

    initial_machines = [
        {
            "id": "MCH-01",
            "name": "Heavy Duty Induction Motor",
            "type": "Induction Motor",
            "location": "Bay A - Primary Drive",
            "age_years": 4,
            "status": "Healthy",
            "health_score": 96.5,
            "failure_prob": 0.04,
            "last_maintenance": (datetime.now() - timedelta(days=18)).strftime("%Y-%m-%d"),
            "operating_hours": 3420,
            "volt": 171.2,
            "rotate": 448.6,
            "pressure": 101.4,
            "vibration": 39.8,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-02",
            "name": "5-Axis CNC Milling Center",
            "type": "CNC Mill",
            "location": "Precision Machining Cell 2",
            "age_years": 2,
            "status": "Healthy",
            "health_score": 93.0,
            "failure_prob": 0.07,
            "last_maintenance": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
            "operating_hours": 1850,
            "volt": 169.5,
            "rotate": 452.1,
            "pressure": 99.2,
            "vibration": 41.2,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-03",
            "name": "High-Pressure Rotary Compressor",
            "type": "Compressor",
            "location": "Utility Deck 1",
            "age_years": 6,
            "status": "Warning",
            "health_score": 74.2,
            "failure_prob": 0.36,
            "last_maintenance": (datetime.now() - timedelta(days=45)).strftime("%Y-%m-%d"),
            "operating_hours": 6120,
            "volt": 182.4,
            "rotate": 420.0,
            "pressure": 118.6,
            "vibration": 46.5,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-04",
            "name": "Industrial Conveyor Drive System",
            "type": "Conveyor",
            "location": "Assembly Line 4",
            "age_years": 5,
            "status": "Critical",
            "health_score": 38.6,
            "failure_prob": 0.88,
            "last_maintenance": (datetime.now() - timedelta(days=78)).strftime("%Y-%m-%d"),
            "operating_hours": 7890,
            "volt": 194.8,
            "rotate": 382.4,
            "pressure": 128.2,
            "vibration": 58.7,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-05",
            "name": "Centrifugal Slurry Turbopump",
            "type": "Turbopump",
            "location": "Fluid Handling Cell 3",
            "age_years": 7,
            "status": "High Risk",
            "health_score": 52.4,
            "failure_prob": 0.68,
            "last_maintenance": (datetime.now() - timedelta(days=62)).strftime("%Y-%m-%d"),
            "operating_hours": 8940,
            "volt": 188.1,
            "rotate": 395.2,
            "pressure": 122.8,
            "vibration": 53.4,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-06",
            "name": "Hydraulic Stamping Press 400T",
            "type": "Hydraulic Press",
            "location": "Heavy Forging Hall",
            "age_years": 3,
            "status": "Healthy",
            "health_score": 91.8,
            "failure_prob": 0.09,
            "last_maintenance": (datetime.now() - timedelta(days=22)).strftime("%Y-%m-%d"),
            "operating_hours": 2900,
            "volt": 172.0,
            "rotate": 441.5,
            "pressure": 103.1,
            "vibration": 40.5,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-07",
            "name": "Exhaust Gas Centrifugal Fan",
            "type": "Centrifugal Fan",
            "location": "Ventilation Tower B",
            "age_years": 8,
            "status": "Warning",
            "health_score": 68.5,
            "failure_prob": 0.42,
            "last_maintenance": (datetime.now() - timedelta(days=39)).strftime("%Y-%m-%d"),
            "operating_hours": 9400,
            "volt": 178.6,
            "rotate": 412.3,
            "pressure": 112.4,
            "vibration": 48.2,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": "MCH-08",
            "name": "Articulated Robotic Welder Unit",
            "type": "Robotic Arm",
            "location": "Automated Welding Bay 1",
            "age_years": 1,
            "status": "Healthy",
            "health_score": 98.2,
            "failure_prob": 0.02,
            "last_maintenance": (datetime.now() - timedelta(days=8)).strftime("%Y-%m-%d"),
            "operating_hours": 980,
            "volt": 169.8,
            "rotate": 451.0,
            "pressure": 98.4,
            "vibration": 38.9,
            "created_at": datetime.now().isoformat()
        }
    ]

    for m in initial_machines:
        cursor.execute("""
        INSERT INTO machines (id, name, type, location, age_years, status, health_score, failure_prob, last_maintenance, operating_hours, volt, rotate, pressure, vibration, created_at)
        VALUES (:id, :name, :type, :location, :age_years, :status, :health_score, :failure_prob, :last_maintenance, :operating_hours, :volt, :rotate, :pressure, :vibration, :created_at)
        """, m)

    # Initial maintenance records
    initial_maintenance = [
        {
            "machine_id": "MCH-04",
            "title": "Emergency Bearing Replacement & Alignment",
            "description": "High vibration alert triggered (>58 mm/s). Requires immediate drive shaft bearing replacement and laser realignment.",
            "priority": "Urgent",
            "status": "In Progress",
            "technician": "Marcus Vance (Senior Mechanical)",
            "scheduled_date": datetime.now().strftime("%Y-%m-%d"),
            "completed_date": None,
            "cost": 1250.0
        },
        {
            "machine_id": "MCH-05",
            "title": "Impeller Cavitation & Seal Inspection",
            "description": "Severe pressure drop and erratic RPM detected. Inspect mechanical seals and slurry impeller wear.",
            "priority": "High",
            "status": "Scheduled",
            "technician": "Elena Rostova (Fluid Dynamics Specialist)",
            "scheduled_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "completed_date": None,
            "cost": 890.0
        },
        {
            "machine_id": "MCH-03",
            "title": "Lubrication Oil Flush and Valve Clearance Check",
            "description": "Pressure buildup observed on valve manifold. Routine flush and intake valve recalibration.",
            "priority": "Medium",
            "status": "Pending",
            "technician": "David Chen (Maintenance Tech)",
            "scheduled_date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "completed_date": None,
            "cost": 420.0
        },
        {
            "machine_id": "MCH-01",
            "title": "Quarterly Preventive Stator Winding Insulation Test",
            "description": "Megger test passed with >100 MOhm resistance. Thermal imaging indicated normal thermal gradient.",
            "priority": "Low",
            "status": "Completed",
            "technician": "Sarah Jenkins (Electrical Lead)",
            "scheduled_date": (datetime.now() - timedelta(days=18)).strftime("%Y-%m-%d"),
            "completed_date": (datetime.now() - timedelta(days=18)).strftime("%Y-%m-%d"),
            "cost": 310.0
        },
        {
            "machine_id": "MCH-02",
            "title": "Spindle Runout Calibration & Coolant Filter Change",
            "description": "Precision check on 5-axis spindle bearings. Total indicated runout within 0.002 mm tolerance.",
            "priority": "Low",
            "status": "Completed",
            "technician": "Kenji Takahashi (Precision Tooling Specialist)",
            "scheduled_date": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
            "completed_date": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
            "cost": 550.0
        }
    ]

    for mr in initial_maintenance:
        cursor.execute("""
        INSERT INTO maintenance_records (machine_id, title, description, priority, status, technician, scheduled_date, completed_date, cost)
        VALUES (:machine_id, :title, :description, :priority, :status, :technician, :scheduled_date, :completed_date, :cost)
        """, mr)

    # Initial alerts
    initial_alerts = [
        {
            "machine_id": "MCH-04",
            "type": "Critical",
            "title": "Critical Vibration Spike Exceeded Safe Threshold",
            "message": "Conveyor Drive MCH-04 registered vibration of 58.7 mm/s (Safety limit: 45 mm/s). Immediate inspection requested.",
            "read": 0,
            "timestamp": (datetime.now() - timedelta(minutes=24)).isoformat()
        },
        {
            "machine_id": "MCH-05",
            "type": "Warning",
            "title": "Slurry Pump Pressure Deviation Detected",
            "message": "Turbopump MCH-05 pressure rose to 122.8 psi. ML model projects 68% probability of seal failure within 7 days.",
            "read": 0,
            "timestamp": (datetime.now() - timedelta(hours=2, minutes=15)).isoformat()
        },
        {
            "machine_id": "MCH-03",
            "type": "Warning",
            "title": "Rotary Compressor RPM Fluctuation",
            "message": "Rotation drop to 420 RPM with voltage surge to 182.4 V. Predictive horizon indicates inspection required in 4 days.",
            "read": 1,
            "timestamp": (datetime.now() - timedelta(hours=6)).isoformat()
        },
        {
            "machine_id": "MCH-01",
            "type": "Info",
            "title": "Induction Motor Telemetry Stable",
            "message": "Continuous 48-hour health telemetry indicates 96.5% optimal efficiency score.",
            "read": 1,
            "timestamp": (datetime.now() - timedelta(hours=14)).isoformat()
        }
    ]

    for al in initial_alerts:
        cursor.execute("""
        INSERT INTO alerts (machine_id, type, title, message, read, timestamp)
        VALUES (:machine_id, :type, :title, :message, :read, :timestamp)
        """, al)

    # Default settings
    default_settings = {
        "active_model": "random_forest",
        "prediction_horizon_days": "7",
        "volt_min": "150.0",
        "volt_max": "190.0",
        "rotate_min": "400.0",
        "rotate_max": "490.0",
        "pressure_min": "85.0",
        "pressure_max": "115.0",
        "vibration_max": "46.0",
        "auto_alert_sound": "true",
        "plant_name": "OptiMach Industrial Smart Plant Alpha"
    }

    for k, v in default_settings.items():
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded successfully.")

