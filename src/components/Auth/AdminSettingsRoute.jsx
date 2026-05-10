import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../../api/authService";
import { canAccessConfiguracoesSistema } from "../../constants/configAccess";

/**
 * Configurações avançadas (permissões + parâmetros): Administrador ou dev@gmail.com.
 */
export default function AdminSettingsRoute({ children }) {
  const user = authService.getUsuario();
  const ok = canAccessConfiguracoesSistema(user);
  const toastShown = useRef(false);

  useEffect(() => {
    if (!ok && !toastShown.current) {
      toastShown.current = true;
      toast.error("Acesso restrito a administradores.");
    }
  }, [ok]);

  if (!ok) {
    return <Navigate to="/" replace />;
  }

  return children;
}
