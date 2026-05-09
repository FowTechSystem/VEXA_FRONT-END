// src/api/settingsService.js
import api from "./axiosConfig";

const LS_KEY = "vexa_system_settings_bulk";

function normalizeFromApi(data) {
  if (!data) return {};
  if (Array.isArray(data)) {
    return data.reduce((acc, row) => {
      const k = row.key ?? row.Key;
      const v = row.value ?? row.Value;
      if (k != null) acc[String(k)] = v != null ? String(v) : "";
      return acc;
    }, {});
  }
  if (typeof data === "object") return { ...data };
  return {};
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** GET /settings ou fallback localStorage */
export async function fetchSettingsMap() {
  try {
    const res = await api.get("/settings");
    const payload = res.data?.data ?? res.data?.settings ?? res.data;
    const map = normalizeFromApi(payload);
    if (Object.keys(map).length > 0) return map;
  } catch {
    /* API opcional */
  }
  return loadLocal();
}

/** PUT /settings/bulk — body [{ key, value }] ; fallback grava local */
export async function bulkUpdateSettings(entries) {
  const body = entries.map(({ key, value }) => ({
    key,
    value: value === undefined || value === null ? "" : String(value),
  }));
  try {
    await api.put("/settings/bulk", body);
  } catch {
    /* fallback */
  }
  const prev = loadLocal();
  const next = { ...prev };
  body.forEach(({ key, value }) => {
    next[key] = value;
  });
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}
