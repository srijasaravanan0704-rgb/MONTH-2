/**
 * API client service for PhishShift Backend.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorDetail = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Fallback to text
        const text = await res.text();
        if (text) errorDetail = text;
      }
      throw new Error(errorDetail);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),

  // Scanner
  scanMessage: (data) =>
    request('/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEducationalSamples: () => request('/samples'),

  // History
  getScans: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.channel && params.channel !== 'all') query.append('channel', params.channel);
    if (params.risk_category && params.risk_category !== 'all') query.append('risk_category', params.risk_category);
    if (params.search) query.append('search', params.search);
    return request(`/scans?${query.toString()}`);
  },
  getScanDetail: (id) => request(`/scans/${id}`),
  deleteScan: (id) => request(`/scans/${id}`, { method: 'DELETE' }),
  clearAllScans: () => request('/scans', { method: 'DELETE' }),
  getExportCsvUrl: () => `${API_BASE}/scans/export`,

  // Models & Evaluation
  getModels: () => request('/models'),
  getModelMetrics: () => request('/models/metrics'),
  getExperiments: () => request('/experiments'),
  getRobustnessResults: () => request('/robustness/results'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) =>
    request('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
