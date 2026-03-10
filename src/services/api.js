const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("access_token");
export const setToken = (token) => localStorage.setItem("access_token", token);
export const removeToken = () => localStorage.removeItem("access_token");

// ── Base fetch ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    window.location.href = "/login";
    return;
  }

  const data = res.status !== 204 ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch("/auth/me"),

  logout: () => {
    removeToken();
    return apiFetch("/auth/logout", { method: "POST" });
  },
};

// ── Evaluations ───────────────────────────────────────────────────────────────
export const evaluationsAPI = {
  save: (evaluationData) =>
    apiFetch("/evaluations/", {
      method: "POST",
      body: JSON.stringify(evaluationData),
    }),

  list: (subject = "", skip = 0, limit = 50) => {
    const params = new URLSearchParams({ skip, limit });
    if (subject) params.set("subject", subject);
    return apiFetch(`/evaluations/?${params}`);
  },

  stats: () => apiFetch("/evaluations/stats"),

  get: (id) => apiFetch(`/evaluations/${id}`),

  delete: (id) => apiFetch(`/evaluations/${id}`, { method: "DELETE" }),
};