const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function classifyEmail(subject, body) {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject, body }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || `Prediction request failed (${res.status})`);
  }

  return res.json();
}

export async function getModelInfo() {
  const res = await fetch(`${API_BASE_URL}/model-info`);
  if (!res.ok) {
    throw new Error(`Failed to load model information (${res.status})`);
  }
  return res.json();
}

export async function getStatistics() {
  const res = await fetch(`${API_BASE_URL}/statistics`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard statistics (${res.status})`);
  }
  return res.json();
}
