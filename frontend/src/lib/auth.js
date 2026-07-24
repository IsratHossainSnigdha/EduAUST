// Small auth helper shared across pages: API base, token storage, and a
// fetch wrapper that attaches the Bearer token and parses JSON.

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const ACCESS_KEY = 'eduaust_access_token';
const REFRESH_KEY = 'eduaust_refresh_token';
const USER_KEY = 'eduaust_user';

export function saveAuth({ access_token, refresh_token, user }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// POST JSON; returns { ok, body }.
export async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, body };
}

// GET JSON with the stored Bearer token; returns { ok, body }.
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${getAccessToken()}` },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, body };
}

// Surface the first Laravel validation error (422) as a single message.
export function firstError(body, fallback) {
  if (body?.errors) {
    const first = Object.values(body.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return body?.message || fallback;
}
