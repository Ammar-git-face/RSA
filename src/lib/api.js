const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Token helpers ─────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? sessionStorage.getItem("rsa_token") : null;

// ── Core fetch ────────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    // Token expired or invalid — clear session and redirect
    if (res.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("rsa_token");
      window.location.href = "/";
      return;
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// ── API surface ───────────────────────────────────────────────────────────────
export const api = {
  // Auth
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request("/api/auth/me"),

  updateAdmin: (payload) =>
    request("/api/auth/update", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Dashboard
  getDashboard: () => request("/api/dashboard/stats"),

  // Invoices
  getInvoices: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/invoices${q ? `?${q}` : ""}`);
  },

  getInvoice: (id) => request(`/api/invoices/${id}`),

  createInvoice: (payload) =>
    request("/api/invoices", { method: "POST", body: JSON.stringify(payload) }),

  updateInvoice: (id, payload) =>
    request(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteInvoice: (id) =>
    request(`/api/invoices/${id}`, { method: "DELETE" }),

  // Settings & Catalogue
  getSettings: () => request("/api/settings"),
  updateSettings: (payload) =>
    request("/api/settings", { method: "PUT", body: JSON.stringify(payload) }),

  getCatalogue: () => request("/api/catalogue"),
};

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmt = (n) =>
  "₦" + Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 });

export const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const fmtShort = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
};
