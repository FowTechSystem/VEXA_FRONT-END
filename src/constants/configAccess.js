import { isDevAdminUser } from "./devAdmin";

/** Perfil com acesso à tela Configurações (permissões + parâmetros). */
export function isAdministradorPerfil(user) {
  const raw =
    user?.perfil ??
    user?.Perfil ??
    user?.roleLabel ??
    user?.cargo ??
    "";
  const p = String(raw).trim().toLowerCase();
  return (
    p === "administrador" ||
    p === "admin" ||
    p === "administrador do sistema"
  );
}

/** Administrador (perfil) ou conta dev — espelha menu + rota. */
export function canAccessConfiguracoesSistema(user) {
  return isDevAdminUser(user) || isAdministradorPerfil(user);
}
