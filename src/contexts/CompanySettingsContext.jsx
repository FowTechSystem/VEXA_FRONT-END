/**
 * Carrega e propaga as configurações white-label da empresa logada.
 * Aplica CSS variables (cores) no :root para usos fora do MUI palette.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMySettings, DEFAULT_SETTINGS } from "../api/companySettingsService";
import { isModuleEnabled as isEnabled } from "../constants/modules";
import { AUTH_CHANGED_EVENT } from "../utils/authEvents";
import { authService } from "../api/authService";

const CompanySettingsContext = createContext(null);

/** Reservado pela spec (não alteráveis pelo dev). */
const RESERVED_COLORS = Object.freeze({
  success: "#10B981",
  danger: "#EF4444",
  info: "#3B82F6",
  warning: "#F59E0B",
});

/** Injeta as CSS vars no :root (cores + tema). Não bloqueia renderização. */
export function applyTheme(settings) {
  if (typeof document === "undefined" || !settings) return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", settings.primary_color);
  root.style.setProperty("--color-secondary", settings.secondary_color);
  root.style.setProperty("--color-success", RESERVED_COLORS.success);
  root.style.setProperty("--color-danger", RESERVED_COLORS.danger);
  root.style.setProperty("--color-info", RESERVED_COLORS.info);
  root.style.setProperty("--color-warning", RESERVED_COLORS.warning);
  root.setAttribute("data-theme", settings.default_theme || "dark");
}

export function CompanySettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Rotas públicas → usa defaults sem bater na API (evita 400/401 desnecessários).
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      const isPublicRoute = /^\/(login|recuperar-senha|redefinir-senha|catalogo-publico)/.test(path);
      if (isPublicRoute || !authService.isAuthenticated()) {
        applyTheme(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
        return;
      }
      const data = await fetchMySettings();
      applyTheme(data);
      setSettings(data);
    } catch (err) {
      console.warn("[CompanySettings] falha ao carregar:", err);
      setError(err);
      applyTheme(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Recarrega quando o login/logout acontecem.
  useEffect(() => {
    const handler = () => load();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }, [load]);

  /** Atualiza in-memory sem ir ao backend (otimistic + após save do dev). */
  const updateLocal = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      applyTheme(next);
      return next;
    });
  }, []);

  const isModuleEnabled = useCallback(
    (key) => isEnabled(key, settings?.enabled_modules),
    [settings],
  );

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh: load,
      updateLocal,
      isModuleEnabled,
    }),
    [settings, loading, error, load, updateLocal, isModuleEnabled],
  );

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) {
    throw new Error(
      "useCompanySettings deve ser usado dentro de CompanySettingsProvider",
    );
  }
  return ctx;
}

export { RESERVED_COLORS };
