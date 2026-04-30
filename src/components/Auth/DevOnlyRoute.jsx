import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../api/authService";
import { isDevAdminUser } from "../../constants/devAdmin";

/** Só renderiza filhos se o usuário logado for dev@gmail.com (painel dev). */
export default function DevOnlyRoute({ children }) {
  const user = authService.getUsuario();
  if (!isDevAdminUser(user)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
