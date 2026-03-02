import { getAuthToken, logout } from "./auth";

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const NORMALIZED_API_BASE = String(RAW_API_BASE || "").trim().replace(/\/+$/, "");
const API_BASE = /\/api$/i.test(NORMALIZED_API_BASE) ? NORMALIZED_API_BASE : `${NORMALIZED_API_BASE}/api`;
const STORAGE_KEY = "inventory_additions_v1";
let hasTriedServerSync = false;

function readAdditions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to read inventory additions", e);
    return {};
  }
}

function writeAdditions(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error("Failed to write inventory additions", e);
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function uniqueTrimmed(items) {
  const set = new Set();
  for (const raw of items || []) {
    const item = normalizeText(raw);
    if (!item) continue;
    set.add(item);
  }
  return Array.from(set);
}

async function inventoryApi(path, options = {}) {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      logout();
      try {
        window.location.hash = "#/login";
      } catch {
        // ignore
      }
      return { success: false, message: "Session expired. Please login again." };
    }

    if (!res.ok) {
      return { success: false, message: data?.message || "Request failed", status: res.status };
    }

    return data;
  } catch {
    return { success: false, message: "Cannot connect to server" };
  }
}

function triggerCatalogChanged() {
  try {
    window.dispatchEvent(new Event("inventoryCategoriesChanged"));
  } catch {
    // ignore
  }
}

function triggerHistoryChanged() {
  try {
    window.dispatchEvent(new Event("inventoryHistoryChanged"));
  } catch {
    // ignore
  }
}

function triggerRequirementsChanged() {
  try {
    window.dispatchEvent(new Event("inventoryRequirementsChanged"));
  } catch {
    // ignore
  }
}

export async function syncCategoriesFromServer() {
  const res = await inventoryApi("/inventory/categories", { method: "GET" });
  if (!res?.success || !Array.isArray(res?.data)) {
    return { success: false, message: res?.message || "Failed to sync categories" };
  }

  const additions = {};
  res.data.forEach((category) => {
    const title = normalizeText(category?.title);
    if (!title) return;
    additions[title] = uniqueTrimmed(category?.items || []);
  });

  writeAdditions(additions);
  triggerCatalogChanged();
  return { success: true };
}

function ensureServerSyncOnce() {
  if (hasTriedServerSync) return;
  hasTriedServerSync = true;
  void syncCategoriesFromServer();
}

export function getCategories() {
  ensureServerSyncOnce();
  const additions = readAdditions();
  return Object.keys(additions).map((title) => ({
    title,
    items: uniqueTrimmed(additions[title] || []),
  }));
}

export async function addItemToCategory(categoryTitle, itemName) {
  const title = normalizeText(categoryTitle);
  const name = normalizeText(itemName);
  if (!name || !title) return { success: false, message: "Category and item are required" };

  const res = await inventoryApi("/inventory/items", {
    method: "POST",
    body: JSON.stringify({ categoryTitle: title, itemName: name }),
  });

  if (!res.success) return { success: false, message: res.message || "Failed to add item" };

  const additions = readAdditions();
  additions[title] = uniqueTrimmed([...(additions[title] || []), name]);
  writeAdditions(additions);
  triggerCatalogChanged();
  return { success: true };
}

export async function editItem(categoryTitle, oldItemName, newItemName) {
  const title = normalizeText(categoryTitle);
  const oldName = normalizeText(oldItemName);
  const newName = normalizeText(newItemName);
  if (!oldName || !newName || !title) return { success: false, message: "Invalid item update request" };

  const res = await inventoryApi("/inventory/items", {
    method: "PATCH",
    body: JSON.stringify({ categoryTitle: title, oldItemName: oldName, newItemName: newName }),
  });

  if (!res.success) return { success: false, message: res.message || "Failed to update item" };

  const additions = readAdditions();
  const list = [...(additions[title] || [])];
  const index = list.indexOf(oldName);
  if (index >= 0) {
    list[index] = newName;
    additions[title] = uniqueTrimmed(list);
    writeAdditions(additions);
  }
  triggerCatalogChanged();
  triggerHistoryChanged();
  return { success: true };
}

export async function deleteItem(categoryTitle, itemName) {
  const title = normalizeText(categoryTitle);
  const name = normalizeText(itemName);
  if (!name || !title) return { success: false, message: "Invalid item delete request" };

  const res = await inventoryApi(`/inventory/items?categoryTitle=${encodeURIComponent(title)}&itemName=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message || "Failed to delete item" };

  const additions = readAdditions();
  const list = [...(additions[title] || [])];
  const index = list.indexOf(name);

  if (index >= 0) {
    list.splice(index, 1);
    if (list.length === 0) delete additions[title];
    else additions[title] = uniqueTrimmed(list);
    writeAdditions(additions);
  }

  triggerCatalogChanged();
  triggerHistoryChanged();
  return { success: true };
}

export async function deleteCategory(categoryTitle) {
  const title = normalizeText(categoryTitle);
  if (!title) return { success: false, message: "Category name is required" };

  const res = await inventoryApi(`/inventory/categories?title=${encodeURIComponent(title)}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message || "Failed to delete category" };

  const additions = readAdditions();
  delete additions[title];
  writeAdditions(additions);

  triggerCatalogChanged();
  triggerHistoryChanged();
  return { success: true };
}

export function clearAdditions() {
  writeAdditions({});
  triggerCatalogChanged();
}

export async function addCategory(categoryTitle) {
  const title = normalizeText(categoryTitle);
  if (!title) return { success: false, message: "Category name is required" };

  const existing = getCategories().find((c) => c.title === title);
  if (existing) return { success: false, message: "Category already exists" };

  const res = await inventoryApi("/inventory/categories", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  if (!res.success) return { success: false, message: res.message || "Failed to add category" };

  const additions = readAdditions();
  additions[title] = [];
  writeAdditions(additions);
  triggerCatalogChanged();
  return { success: true };
}

export async function fetchHistoryRecords() {
  const res = await inventoryApi("/inventory/history", { method: "GET" });
  if (!res.success) return { success: false, message: res.message || "Failed to load history", data: [] };
  return { success: true, data: Array.isArray(res.data) ? res.data : [] };
}

export async function fetchRequirements(dateOnly) {
  const query = dateOnly ? `?dateOnly=${encodeURIComponent(dateOnly)}` : "";
  const res = await inventoryApi(`/inventory/requirements${query}`, { method: "GET" });
  if (!res.success) return { success: false, message: res.message || "Failed to load requirements", data: [] };
  return { success: true, data: Array.isArray(res.data) ? res.data : [] };
}

export async function deleteRequirement(id) {
  const res = await inventoryApi(`/inventory/requirements/${id}`, { method: "DELETE" });
  if (!res.success) return { success: false, message: res.message || "Failed to delete requirement" };
  triggerRequirementsChanged();
  return { success: true };
}

export async function saveHistoryRecord(payload) {
  const res = await inventoryApi("/inventory/history", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.success) return { success: false, message: res.message || "Failed to save history" };
  triggerHistoryChanged();
  try {
    triggerRequirementsChanged();
  } catch {}
  return { success: true, data: res.data };
}

export async function updateHistoryRecord(id, items) {
  const res = await inventoryApi(`/inventory/history/${id}`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
  if (!res.success) return { success: false, message: res.message || "Failed to update history" };
  triggerHistoryChanged();
  try {
    triggerRequirementsChanged();
  } catch {}
  return { success: true, data: res.data };
}

export async function deleteHistoryRecord(id) {
  const res = await inventoryApi(`/inventory/history/${id}`, {
    method: "DELETE",
  });
  if (!res.success) return { success: false, message: res.message || "Failed to delete history" };
  triggerHistoryChanged();
  try {
    triggerRequirementsChanged();
  } catch {}
  return { success: true };
}
