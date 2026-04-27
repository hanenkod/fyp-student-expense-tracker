/**
 * POCKE API client.
 *
 * Thin wrapper around fetch() that:
 *   - Prepends the API base URL.
 *   - Auto-attaches the JWT from LocalStorage when present.
 *   - Throws an ApiError on non-2xx so callers can use try/catch.
 *   - Returns the parsed JSON body on success.
 *
 * The base URL falls back to http://localhost:4000 for development. To
 * point at a deployed backend, set VITE_API_URL in the project's .env.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "pockeToken";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Error thrown for any non-2xx HTTP response. The original status code
 * and parsed body are exposed so callers can render field-level errors.
 */
class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Internal: build and dispatch a single HTTP request.
 *
 * @param {string} path     URL path beginning with "/api/..."
 * @param {object} options  { method, body, headers }
 * @returns parsed JSON response body
 * @throws  ApiError on non-2xx responses
 */
const request = async (path, { method = "GET", body, headers = {} } = {}) => {
  const token = getToken();
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Try to parse a body — both success and error responses are JSON.
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    // Auto-clear the token on 401 so the next render redirects to login.
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, data);
  }

  return data;
};

/**
 * Public surface used by every component that talks to the backend.
 * Grouped by resource for readability.
 */
export const api = {
  // ── Auth ────────────────────────────────────────────────────────────
  register: (email, password, name) =>
    request("/api/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  // ── User ────────────────────────────────────────────────────────────
  getMe: () => request("/api/users/me"),
  updateMe: (patch) =>
    request("/api/users/me", { method: "PATCH", body: patch }),
  changePassword: (current, newPassword) =>
    request("/api/users/me/password", {
      method: "POST",
      body: { current, new: newPassword },
    }),
  deleteMe: () => request("/api/users/me", { method: "DELETE" }),
  migrate: (payload) =>
    request("/api/users/me/migrate", { method: "POST", body: payload }),

  // ── Transactions ────────────────────────────────────────────────────
  listTransactions: () => request("/api/transactions"),
  createTransaction: (tx) =>
    request("/api/transactions", { method: "POST", body: tx }),
  updateTransaction: (id, patch) =>
    request(`/api/transactions/${id}`, { method: "PATCH", body: patch }),
  deleteTransaction: (id) =>
    request(`/api/transactions/${id}`, { method: "DELETE" }),

  // ── Scheduled payments ──────────────────────────────────────────────
  listScheduled: () => request("/api/scheduled"),
  createScheduled: (sp) =>
    request("/api/scheduled", { method: "POST", body: sp }),
  deleteScheduled: (id) =>
    request(`/api/scheduled/${id}`, { method: "DELETE" }),

  // ── Goals ───────────────────────────────────────────────────────────
  listGoals: () => request("/api/goals"),
  createGoal: (g) => request("/api/goals", { method: "POST", body: g }),
  updateGoal: (id, patch) =>
    request(`/api/goals/${id}`, { method: "PATCH", body: patch }),
  deleteGoal: (id) => request(`/api/goals/${id}`, { method: "DELETE" }),
  addToGoal: (id, amount) =>
    request(`/api/goals/${id}/add`, { method: "POST", body: { amount } }),
  withdrawFromGoal: (id, amount) =>
    request(`/api/goals/${id}/withdraw`, {
      method: "POST",
      body: { amount },
    }),
};

export { ApiError };
