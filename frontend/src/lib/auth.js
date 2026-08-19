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

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
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

// A page that fires several requests at once would otherwise spend its refresh
// token several times over, so concurrent callers share one attempt.
let refreshInFlight = null;

// Exchange the stored refresh token for a new access token.
//
// Resolves to whether a fresh access token is now in storage. A session
// started without "Remember me" has no refresh token at all, so this simply
// reports failure and the caller falls through to the 401.
async function refreshAccessToken() {
  if (!getRefreshToken()) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: getRefreshToken() }),
      });

      if (!res.ok) return false;

      const body = await res.json().catch(() => ({}));
      if (!body.access_token) return false;

      saveAuth(body);

      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

// Perform a request and always resolve to { ok, body }.
//
// fetch() rejects when the server is unreachable, which would otherwise leave
// callers awaiting a promise that never resolves — a page stuck on its loading
// state with nothing on screen to explain why.
//
// On a 401 the access token is refreshed once and the request replayed, so an
// expired token renews itself instead of surfacing as an error.
async function request(path, { method = 'GET', payload, retryOnExpiry = true } = {}) {
  const token = getAccessToken();

  const headers = { Accept: 'application/json' };
  if (payload !== undefined) headers['Content-Type'] = 'application/json';
  // Public endpoints such as login and registration ignore this header, so it
  // is safe to attach whenever a token exists. Omitting it for one verb is
  // what previously made authenticated POSTs fail as "Unauthenticated.".
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
  } catch {
    return {
      ok: false,
      body: { message: 'Could not reach the server. Please check your connection and try again.' },
    };
  }

  if (res.status === 401 && token && retryOnExpiry && (await refreshAccessToken())) {
    return request(path, { method, payload, retryOnExpiry: false });
  }

  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, body };
}

// POST JSON; returns { ok, body }.
export function apiPost(path, payload) {
  return request(path, { method: 'POST', payload: payload ?? {} });
}

// GET JSON; returns { ok, body }.
export function apiGet(path) {
  return request(path);
}

// PATCH JSON; returns { ok, body }.
export function apiPatch(path, payload) {
  return request(path, { method: 'PATCH', payload: payload ?? {} });
}

// Whether a failed response means the session is over and the user has to sign
// in again, as opposed to an ordinary validation or server error.
export function isUnauthenticated(body) {
  return body?.message === 'Unauthenticated.';
}

// Surface the first Laravel validation error (422) as a single message.
export function firstError(body, fallback) {
  if (body?.errors) {
    const first = Object.values(body.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return body?.message || fallback;
}
