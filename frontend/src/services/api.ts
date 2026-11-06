import {
  Machine,
  MaintenanceRecord,
  Alert,
  PredictionResult,
  BatchPredictionResponse,
  MLMetricsResponse,
  DashboardStats,
  DashboardAnalytics,
  LiveTelemetryResponse,
  GeneratedReport,
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL;
const resolvedHost = envApiUrl
  ? (envApiUrl.startsWith('http://') || envApiUrl.startsWith('https://') ? envApiUrl : `https://${envApiUrl}`).replace(/\/$/, '')
  : '';
const API_BASE = resolvedHost ? `${resolvedHost}/api` : '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const res = await fetch(`${API_BASE}/dashboard/analytics`);
  if (!res.ok) throw new Error('Failed to fetch dashboard analytics');
  return res.json();
}

export async function fetchMachines(search?: string, status?: string, sortBy?: string, order?: string): Promise<Machine[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  if (sortBy) params.append('sort_by', sortBy);
  if (order) params.append('order', order);

  const res = await fetch(`${API_BASE}/machines?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch machines');
  return res.json();
}

export async function fetchMachineById(id: string): Promise<Machine> {
  const res = await fetch(`${API_BASE}/machines/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch machine ${id}`);
  return res.json();
}

export async function createMachine(data: Partial<Machine>): Promise<any> {
  const res = await fetch(`${API_BASE}/machines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create machine');
  }
  return res.json();
}

export async function updateMachine(id: string, data: Partial<Machine>): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update machine');
  }
  return res.json();
}

export async function deleteMachine(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/machines/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete machine');
  return res.json();
}

export async function predictManual(
  volt: number,
  rotate: number,
  pressure: number,
  vibration: number,
  modelType: string = 'random_forest',
  machineId: string = 'MCH-EXP'
): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      volt,
      rotate,
      pressure,
      vibration,
      model_type: modelType,
      machine_id: machineId,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function predictBatchCSV(file: File, modelType: string = 'random_forest'): Promise<BatchPredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_type', modelType);

  const res = await fetch(`${API_BASE}/predict/batch`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Batch prediction failed');
  }
  return res.json();
}

export function getSampleCsvUrl(): string {
  return `${API_BASE}/predict/sample-csv`;
}

export async function fetchMlMetrics(): Promise<MLMetricsResponse> {
  const res = await fetch(`${API_BASE}/ml/metrics`);
  if (!res.ok) throw new Error('Failed to fetch ML metrics');
  return res.json();
}

export async function fetchLiveTelemetry(machineId: string): Promise<LiveTelemetryResponse> {
  const res = await fetch(`${API_BASE}/monitoring/live/${machineId}`);
  if (!res.ok) throw new Error('Failed to fetch live telemetry');
  return res.json();
}

export async function fetchMaintenanceRecords(status?: string, machineId?: string): Promise<MaintenanceRecord[]> {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (machineId) params.append('machine_id', machineId);

  const res = await fetch(`${API_BASE}/maintenance?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch maintenance records');
  return res.json();
}

export async function createMaintenanceRecord(record: Partial<MaintenanceRecord>): Promise<any> {
  const res = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to create maintenance record');
  return res.json();
}

export async function updateMaintenanceRecord(id: number, record: Partial<MaintenanceRecord>): Promise<any> {
  const res = await fetch(`${API_BASE}/maintenance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to update maintenance record');
  return res.json();
}

export async function deleteMaintenanceRecord(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/maintenance/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete maintenance record');
  return res.json();
}

export async function fetchAlerts(unreadOnly: boolean = false): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts?unread_only=${unreadOnly}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function markAlertRead(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/${id}/read`, { method: 'POST' });
  return res.json();
}

export async function clearAllAlerts(): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/clear-all`, { method: 'POST' });
  return res.json();
}

export async function fetchReportsHistory(): Promise<GeneratedReport[]> {
  const res = await fetch(`${API_BASE}/reports/history`);
  if (!res.ok) throw new Error('Failed to fetch report history');
  return res.json();
}

export async function saveGeneratedReport(report: {
  title: string;
  machine_ids: string[];
  generated_by: string;
  summary: string;
  risk_summary: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error('Failed to save report');
  return res.json();
}

export async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Record<string, string>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function resetDatabase(): Promise<any> {
  const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}

