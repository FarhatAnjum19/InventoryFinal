const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function storeUser(user) {
  const payload = {
    id: user?.id || "",
    name: user?.name || "",
    token: user?.token || "",
  };
  localStorage.setItem("auth_user", JSON.stringify(payload));
}

async function apiRequest(path, payload, options = {}) {
  try {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method || "POST",
      headers,
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data?.message || data?.error || "Request failed", status: res.status };
    return data;
  } catch {
    return { success: false, message: "Cannot connect to server" };
  }
}

export async function login(name, password) {
  if (!name || !String(name).trim()) {
    return { success: false, message: "Please enter username" };
  }
  if (!password) {
    return { success: false, message: "Please enter password" };
  }
  const res = await apiRequest("/auth/login", { name: String(name).trim(), password });
  if (!res.success) return res;
  const user = res?.data || {};
  storeUser(user);
  return { success: true };
}

export function logout() {
  localStorage.removeItem("auth_user");
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("auth_user") || "null");
}

export function getAuthToken() {
  return getCurrentUser()?.token || "";
}
