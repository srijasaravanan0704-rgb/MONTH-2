export type MachineStatus = 'Healthy' | 'Warning' | 'High Risk' | 'Critical';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Pending';
export type AlertType = 'Critical' | 'Warning' | 'Maintenance' | 'Info';

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  age_years: number;
  status: MachineStatus;
  health_score: number;
  failure_prob: number;
  last_maintenance: string;
  operating_hours: number;
  volt: number;
  rotate: number;
  pressure: number;
  vibration: number;
  created_at?: string;
  maintenance_history?: MaintenanceRecord[];
  recent_alerts?: Alert[];
}

export interface MaintenanceRecord {
  id: number;
  machine_id: string;
  machine_name?: string;
  machine_type?: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  technician: string;
  scheduled_date: string;
  completed_date?: string | null;
  cost?: number;
}

export interface Alert {
  id: number;
  machine_id: string;
  type: AlertType;
  title: string;
  message: string;
  read: number;
  timestamp: string;
}

export interface ContributingFactor {
  feature: string;
  label: string;
  value: number;
  unit: string;
  baseline_mean: number;
  safe_range: string;
  deviation_pct: number;
  z_score: number;
  severity: 'Normal' | 'Moderate' | 'High' | 'Critical';
  is_out_of_bounds: boolean;
}

export interface AIRecommendation {
  warning_signs: string[];
  abnormal_parameters: string[];
  possible_issues: string[];
  recommended_actions: string[];
  maintenance_priority: MaintenancePriority;
  suggested_schedule: string;
}

export interface PredictionResult {
  machine_id: string;
  model_used: string;
  model_name: string;
  failure_probability: number;
  failure_probability_pct: number;
  health_score: number;
  risk_category: MachineStatus;
  status_color: string;
  prediction_horizon: string;
  is_demo_mode: boolean;
  contributing_factors: ContributingFactor[];
  recommendations: AIRecommendation;
  telemetry: {
    volt: number;
    rotate: number;
    pressure: number;
    vibration: number;
  };
}

export interface BatchPredictionSummary {
  healthy: number;
  warning: number;
  high_risk: number;
  critical: number;
  average_health_score: number;
  critical_pct: number;
}

export interface BatchPredictionResponse {
  total_processed: number;
  summary: BatchPredictionSummary;
  records: PredictionResult[];
}

export interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
    matrix: number[][];
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ recall: number; precision: number }>;
  feature_importances: Record<string, number>;
}

export interface MLMetricsResponse {
  metadata: {
    dataset_name: string;
    prediction_horizon: string;
    features: string[];
    total_samples: number;
    train_samples: number;
    test_samples: number;
    failure_rate: number;
  };
  models: {
    logistic_regression: ModelMetrics;
    random_forest: ModelMetrics;
    gradient_boosting: ModelMetrics;
  };
}

export interface DashboardStats {
  total_machines: number;
  healthy_machines: number;
  machines_at_risk: number;
  warning_machines: number;
  high_risk_machines: number;
  critical_machines: number;
  predicted_failures: number;
  maintenance_required: number;
  avg_health_score: number;
  health_percentage: number;
}

export interface DashboardAnalytics {
  health_distribution: Array<{ status: MachineStatus; count: number }>;
  machines_risk_comparison: Machine[];
  sensor_parameter_trends: Array<{
    date: string;
    volt: number;
    rotate: number;
    pressure: number;
    vibration: number;
    failure_risk_index: number;
  }>;
  maintenance_distribution: Array<{ status: MaintenanceStatus; count: number }>;
}

export interface LiveTelemetryResponse {
  machine_id: string;
  machine_name: string;
  machine_type: string;
  timestamp: string;
  readings: {
    volt: number;
    rotate: number;
    pressure: number;
    vibration: number;
  };
  health_score: number;
  risk_category: MachineStatus;
  failure_probability: number;
  threshold_alerts: string[];
  is_simulated: boolean;
}

export interface GeneratedReport {
  id: number;
  report_id: string;
  title: string;
  machine_ids: string[];
  generated_by: string;
  summary: string;
  risk_summary: string;
  created_at: string;
}

