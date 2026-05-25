/**
 * Serviço de personalização por empresa (white-label).
 *
 * Endpoints (backend):
 *   GET    /companies/me/settings
 *   GET    /dev/companies/:id/settings
 *   PUT    /dev/companies/:id/settings
 *   PUT    /dev/companies/:id/modules
 *   POST   /dev/companies/:id/logo   (multipart/form-data)
 *   DELETE /dev/companies/:id/logo
 *
 * Fallback: localStorage (igual ao padrão de settingsService.js) — permite o front
 * funcionar enquanto o backend ainda não expõe os endpoints.
 */
import api from "./axiosConfig";
import { DEFAULT_ENABLED_MODULES, MANDATORY_MODULE_KEYS } from "../constants/modules";

const LS_PREFIX = "vexa_company_settings__";
const LS_LOGO_PREFIX = "vexa_company_logo__"; // data URL
const LS_EMPRESA_ATIVA = "empresaAtiva";

/** Descobre o id da empresa logada/ativa a partir do localStorage (X-Empresa-Id alvo). */
function resolveCurrentEmpresaId() {
  try {
    const raw = localStorage.getItem(LS_EMPRESA_ATIVA);
    const empresa = raw ? JSON.parse(raw) : null;
    if (empresa?.id != null) return empresa.id;
  } catch {
    /* ignore */
  }
  try {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    return user.empresaId ?? user.EmpresaId ?? null;
  } catch {
    return null;
  }
}

export const DEFAULT_SETTINGS = Object.freeze({
  display_name: "VEXA",
  logo_url: null,
  primary_color: "#F8F32B",
  secondary_color: "#2B2D42",
  default_theme: "dark",
  enabled_modules: DEFAULT_ENABLED_MODULES,
});

/** Garante que módulos obrigatórios estão sempre na lista. */
function normalizeModules(list) {
  const set = new Set(Array.isArray(list) ? list : []);
  MANDATORY_MODULE_KEYS.forEach((k) => set.add(k));
  return Array.from(set);
}

function normalizeSettings(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  const enabled = Array.isArray(data.enabled_modules)
    ? data.enabled_modules
    : Array.isArray(data.modules)
      ? data.modules
      : Array.isArray(data.enabledModules)
        ? data.enabledModules
        : DEFAULT_ENABLED_MODULES;
  return {
    display_name:
      data.display_name ?? data.displayName ?? DEFAULT_SETTINGS.display_name,
    logo_url: data.logo_url ?? data.logoUrl ?? null,
    primary_color:
      data.primary_color ??
      data.primaryColor ??
      DEFAULT_SETTINGS.primary_color,
    secondary_color:
      data.secondary_color ??
      data.secondaryColor ??
      DEFAULT_SETTINGS.secondary_color,
    default_theme:
      data.default_theme ??
      data.defaultTheme ??
      DEFAULT_SETTINGS.default_theme,
    enabled_modules: normalizeModules(enabled),
  };
}

function lsKey(empresaId) {
  return `${LS_PREFIX}${empresaId ?? "me"}`;
}

function loadLocal(empresaId) {
  try {
    const raw = localStorage.getItem(lsKey(empresaId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(empresaId, settings) {
  try {
    localStorage.setItem(lsKey(empresaId), JSON.stringify(settings));
  } catch {
    /* quota cheia */
  }
}

function loadLocalLogo(empresaId) {
  try {
    return localStorage.getItem(`${LS_LOGO_PREFIX}${empresaId ?? "me"}`);
  } catch {
    return null;
  }
}

function saveLocalLogo(empresaId, dataUrl) {
  try {
    if (dataUrl) {
      localStorage.setItem(`${LS_LOGO_PREFIX}${empresaId ?? "me"}`, dataUrl);
    } else {
      localStorage.removeItem(`${LS_LOGO_PREFIX}${empresaId ?? "me"}`);
    }
  } catch {
    /* quota cheia */
  }
}

/** GET /companies/me/settings — fallback localStorage. */
export async function fetchMySettings() {
  // A empresa logada (ou ativa no painel dev) é o índice correto para o cache local.
  const empresaId = resolveCurrentEmpresaId();
  try {
    const res = await api.get("/companies/me/settings");
    const payload = res.data?.data ?? res.data;
    const normalized = normalizeSettings(payload);
    if (!normalized.logo_url) {
      const local = loadLocalLogo(empresaId ?? "me");
      if (local) normalized.logo_url = local;
    }
    return normalized;
  } catch {
    // Sem backend → resgata o último salvo localmente para a empresa atual.
    const local =
      loadLocal(empresaId) || loadLocal("me") || loadLocal(undefined);
    const merged = normalizeSettings({ ...DEFAULT_SETTINGS, ...(local || {}) });
    const localLogo =
      loadLocalLogo(empresaId) || loadLocalLogo("me");
    if (localLogo) merged.logo_url = localLogo;
    return merged;
  }
}

/** GET /dev/companies/:id/settings — fallback localStorage. */
export async function fetchCompanySettings(empresaId) {
  try {
    const res = await api.get(`/dev/companies/${empresaId}/settings`);
    const payload = res.data?.data ?? res.data;
    const normalized = normalizeSettings(payload);
    if (!normalized.logo_url) {
      const local = loadLocalLogo(empresaId);
      if (local) normalized.logo_url = local;
    }
    return normalized;
  } catch {
    const local = loadLocal(empresaId);
    const merged = normalizeSettings({ ...DEFAULT_SETTINGS, ...(local || {}) });
    const localLogo = loadLocalLogo(empresaId);
    if (localLogo) merged.logo_url = localLogo;
    return merged;
  }
}

/** PUT /dev/companies/:id/settings (cores, nome, tema). */
export async function updateCompanySettings(empresaId, partial) {
  const body = {
    display_name: partial.display_name,
    primary_color: partial.primary_color,
    secondary_color: partial.secondary_color,
    default_theme: partial.default_theme,
  };
  let backendOk = false;
  try {
    await api.put(`/dev/companies/${empresaId}/settings`, body);
    backendOk = true;
  } catch {
    /* fallback localStorage */
  }
  const prev = loadLocal(empresaId) || {};
  const next = normalizeSettings({ ...prev, ...partial });
  saveLocal(empresaId, next);
  return { settings: next, backendOk };
}

/** PUT /dev/companies/:id/modules (lista de módulos ativos). */
export async function updateCompanyModules(empresaId, modules) {
  const enabled_modules = normalizeModules(modules);
  let backendOk = false;
  try {
    await api.put(`/dev/companies/${empresaId}/modules`, { enabled_modules });
    backendOk = true;
  } catch {
    /* fallback */
  }
  const prev = loadLocal(empresaId) || {};
  const next = normalizeSettings({ ...prev, enabled_modules });
  saveLocal(empresaId, next);
  return { settings: next, backendOk };
}

/** POST /dev/companies/:id/logo (multipart). Em fallback, salva como data URL. */
export async function uploadCompanyLogo(empresaId, file) {
  if (!file) throw new Error("Arquivo inválido");
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await api.post(`/dev/companies/${empresaId}/logo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = res.data?.url ?? res.data?.logo_url ?? res.data?.logoUrl;
    if (url) {
      const prev = loadLocal(empresaId) || {};
      saveLocal(empresaId, normalizeSettings({ ...prev, logo_url: url }));
      saveLocalLogo(empresaId, null);
      return { logo_url: url, backendOk: true };
    }
  } catch {
    /* fallback */
  }
  // Fallback local: data URL no localStorage.
  const dataUrl = await readAsDataURL(file);
  saveLocalLogo(empresaId, dataUrl);
  const prev = loadLocal(empresaId) || {};
  saveLocal(empresaId, normalizeSettings({ ...prev, logo_url: dataUrl }));
  return { logo_url: dataUrl, backendOk: false };
}

/** DELETE /dev/companies/:id/logo. */
export async function removeCompanyLogo(empresaId) {
  let backendOk = false;
  try {
    await api.delete(`/dev/companies/${empresaId}/logo`);
    backendOk = true;
  } catch {
    /* fallback */
  }
  const prev = loadLocal(empresaId) || {};
  saveLocal(empresaId, normalizeSettings({ ...prev, logo_url: null }));
  saveLocalLogo(empresaId, null);
  return { backendOk };
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

/** Valida extensão e tamanho do logo. Retorna mensagem de erro ou null. */
export function validateLogoFile(file) {
  if (!file) return "Selecione um arquivo.";
  const okTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
  if (!okTypes.includes(file.type)) {
    return "Formato inválido. Use PNG, JPG, SVG ou WEBP.";
  }
  const MAX = 2 * 1024 * 1024;
  if (file.size > MAX) return "Arquivo acima do limite (2 MB).";
  return null;
}
