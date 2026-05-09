/**
 * Conta de desenvolvimento / super-admin usada no front para painel multi-empresa
 * e rota de Configurações. O backend deve validar as mesmas regras.
 */
export const DEV_ADMIN_EMAIL = "dev@gmail.com";

/** Manter igual a USER_EMAIL_KEY em `authService.js` (último e-mail usado no login). */
const LS_USER_EMAIL_KEY = "userEmail";

/**
 * Prioriza o e-mail gravado no login (`userEmail` no localStorage).
 * Evita menu Empresas / dev para cliente quando `userData` ficou obsoleto no storage.
 */
export function isDevAdminUser(userOrEmail) {
  try {
    const fromLogin = String(localStorage.getItem(LS_USER_EMAIL_KEY) ?? "")
      .trim()
      .toLowerCase();
    if (fromLogin) return fromLogin === DEV_ADMIN_EMAIL;
  } catch (_) {
    /* ignore */
  }
  const email =
    typeof userOrEmail === "string"
      ? userOrEmail
      : userOrEmail?.email ?? userOrEmail?.Email ?? "";
  return String(email).trim().toLowerCase() === DEV_ADMIN_EMAIL;
}
