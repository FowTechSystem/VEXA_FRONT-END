import { useCompanySettings } from "../contexts/CompanySettingsContext";

/**
 * Retorna `true` se o módulo está habilitado para a empresa logada.
 * Módulos obrigatórios sempre retornam `true`. Durante o boot (antes de carregar),
 * retorna `true` para não esconder o menu inteiro num flash.
 */
export function useModuleAccess(moduleKey) {
  const { settings, loading, isModuleEnabled } = useCompanySettings();
  if (loading || !settings) return true;
  return isModuleEnabled(moduleKey);
}
