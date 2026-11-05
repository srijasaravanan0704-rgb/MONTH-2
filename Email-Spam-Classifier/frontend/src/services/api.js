const resolveApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    envUrl = envUrl.trim().replace(/\/+$/, '');
    // Automatically prepend https:// if protocol is omitted (e.g. from Render Blueprint property: host)
    if (!/^https?:\/\//i.test(envUrl)) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl;
  }
  // In development, default to local FastAPI server
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000';
  }
  // Default to relative path if on same domain or reverse proxy
  return '';
};

export const API_BASE_URL = resolveApiBaseUrl();

export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function classifyEmail(payloadOrSubject, body = '', sender = '') {
  let payload;
  if (typeof payloadOrSubject === 'object' && payloadOrSubject !== null) {
    payload = payloadOrSubject;
  } else {
    payload = { sender, subject: payloadOrSubject, body };
  }

  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

export async function clearHistory() {
  const res = await fetch(`${API_BASE_URL}/clear-history`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to clear history (${res.status})`);
  }
  return res.json();
}

export async function submitFeedback(isCorrect, feedback = '') {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_correct: isCorrect, feedback }),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit feedback (${res.status})`);
  }
  return res.json();
}

export async function getSampleDataset({ category = '', search = '', limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const res = await fetch(`${API_BASE_URL}/samples?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load sample dataset (${res.status})`);
  }
  return res.json();
}

