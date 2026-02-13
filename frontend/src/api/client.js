// Simple API client tailored to backend Flask routes
// Base: http://localhost:5000/api unless overridden by VITE_API_BASE
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:5000/nex-backend/api';


function getStoredToken() {
  try {
    const raw = localStorage.getItem('nexus_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (_) {
    return null;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const bearer = token || getStoredToken();
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;

  const resp = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await resp.json();
  } catch {
    data = null;
  }

  if (!resp.ok) {
    const error = data?.error || data?.message || `HTTP ${resp.status}`;
    return { ok: false, status: resp.status, error, data };
  }
  return { ok: true, status: resp.status, data };
}

export async function signup(team_name, password) {
  return request('/auth/signup', {
    method: 'POST',
    body: { team_name, password },
  });
}

export async function login(team_name, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { team_name, password },
  });
}

export async function getTeamActivity(token) {
  return request('/leaderboard/activity', { method: 'GET', token });
}

export async function getLeaderboard() {
  // Public leaderboard: no token required
  return request('/leaderboard/', { method: 'GET' });
}

export async function submitFlag(flagOrPayload, token) {
  const body = typeof flagOrPayload === 'string'
    ? { flag: flagOrPayload }
    : flagOrPayload;
  return request('/game/submit-flag', {
    method: 'POST',
    body,
    token,
  });
}

export async function submitAnswer(avenger, answer, token) {
  return request('/game/submit-answer', {
    method: 'POST',
    body: { avenger, answer },
    token,
  });
}

export async function submitAdvancedFlag(finalFlag, token) {
  return request('/game/submit-advanced-flag', {
    method: 'POST',
    body: { flag: finalFlag },
    token,
  });
}

export async function verifyHulkOsint(osint_code, token) {
  return request('/game/hulk-osint', {
    method: 'POST',
    body: { osint_code },
    token,
  });
}

export async function validateHulkLogicStage(stage, answer, token) {
  return request('/game/hulk-logic-stage', {
    method: 'POST',
    body: { stage, answer },
    token,
  });
}

export async function validateHulkCtfStage(stage, value, token) {
  return request('/game/hulk-ctf-stage', {
    method: 'POST',
    body: { stage, value },
    token,
  });
}

export const api = {
  signup,
  login,
  getTeamActivity,
  getLeaderboard,
  submitFlag,
  submitAnswer,
  submitAdvancedFlag,
  verifyHulkOsint,
  validateHulkLogicStage,
  validateHulkCtfStage,
};
