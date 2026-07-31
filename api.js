const API_BASE = 'http://localhost:8080/api';

function getTokens() {
  const raw = localStorage.getItem('notesgen_auth');
  return raw ? JSON.parse(raw) : null;
}

function setTokens(auth) {
  localStorage.setItem('notesgen_auth', JSON.stringify(auth));
}

function clearTokens() {
  localStorage.removeItem('notesgen_auth');
}

async function request(path, options = {}, retry = true) {
  const tokens = getTokens();
  const headers = { ...(options.headers || {}) };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Access token expired -> try refresh once, then retry the original call.
  if (response.status === 401 && retry && tokens?.refreshToken) {
    const refreshed = await refresh(tokens.refreshToken);
    if (refreshed) {
      return request(path, options, false);
    }
  }

  return response;
}

async function refresh(refreshToken) {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const auth = await res.json();
    setTokens(auth);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export const api = {
  getTokens,
  setTokens,
  clearTokens,
  request,

  async register(fullName, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    setTokens(data);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    setTokens(data);
    return data;
  },

  async summarize(file, style) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('style', style);
    const res = await request('/notes/summarize', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Summarization failed.');
    return data;
  },

  async listDocuments() {
    const res = await request('/notes/documents', { method: 'GET' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load documents.');
    return data;
  },
};
