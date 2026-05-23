import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCompanySettings } from "../../contexts/CompanySettingsContext";

/**
 * Bloqueia o acesso à rota se o módulo estiver desativado para a empresa logada.
 * Renderiza filhos enquanto as settings carregam para evitar flicker / redirect indevido.
 */
export default function ModuleRoute({ moduleKey, children }) {
  const { settings, loading, isModuleEnabled } = useCompanySettings();
  const toastShown = useRef(false);
  const blocked = !loading && settings && !isModuleEnabled(moduleKey);

  useEffect(() => {
    if (blocked && !toastShown.current) {
      toastShown.current = true;
      toast.error("Este módulo não está disponível para sua empresa.");
    }
  }, [blocked]);

  if (loading) return children;
  if (blocked) return <Navigate to="/" replace />;
  return children;
}
