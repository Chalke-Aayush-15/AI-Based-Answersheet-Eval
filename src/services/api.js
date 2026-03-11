// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken   = ()      => localStorage.getItem('evalai_token');
export const setToken   = (t)     => localStorage.setItem('evalai_token', t);
export const removeToken = ()     => localStorage.removeItem('evalai_token');
export const getUser    = ()      => { try { return JSON.parse(localStorage.getItem('evalai_user')); } catch { return null; } };
export const setUser    = (u)     => localStorage.setItem('evalai_user', JSON.stringify(u));
export const removeUser = ()      => localStorage.removeItem('evalai_user');

// ── Base fetch ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    removeUser();
    throw new Error('SESSION_EXPIRED');
  }

  const data = res.status !== 204 ? await res.json() : null;
  if (!res.ok) throw new Error(data?.detail || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => apiFetch('/auth/me'),

  logout: () => { removeToken(); removeUser(); },
};

// ── Evaluations ───────────────────────────────────────────────────────────────
export const evaluationsAPI = {
  save:   (data)                       => apiFetch('/evaluations/', { method: 'POST', body: JSON.stringify(data) }),
  list:   (subject = '', skip = 0, limit = 100) => {
    const p = new URLSearchParams({ skip, limit });
    if (subject) p.set('subject', subject);
    return apiFetch(`/evaluations/?${p}`);
  },
  stats:  ()    => apiFetch('/evaluations/stats'),
  get:    (id)  => apiFetch(`/evaluations/${id}`),
  delete: (id)  => apiFetch(`/evaluations/${id}`, { method: 'DELETE' }),
};