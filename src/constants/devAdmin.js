/**
 * Conta(s) de desenvolvimento / super-admin usada(s) no front para painel multi-empresa
 * e rota de Configurações. O backend deve validar as mesmas regras.
 *
 * `DEV_ADMIN_EMAIL` mantém o e-mail principal (compatibilidade com código que
 * lê a constante). `DEV_ADMIN_EMAILS` permite múltiplas contas dev.
 */
export const DEV_ADMIN_EMAILS = [
  "rafaeldolinski14@gmail.com",
  "dev@gmail.com",
];

export const DEV_ADMIN_EMAIL = DEV_ADMIN_EMAILS[0];

/** Manter igual a USER_EMAIL_KEY em `authService.js` (último e-mail usado no login). */
const LS_USER_EMAIL_KEY = "userEmail";

function matchesDevEmail(email) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  return DEV_ADMIN_EMAILS.some((d) => d.toLowerCase() === e);
}

/**
 * Prioriza o e-mail gravado no login (`userEmail` no localStorage).
 * Evita menu Empresas / dev para cliente quando `userData` ficou obsoleto no storage.
 */
export function isDevAdminUser(userOrEmail) {
  try {
    const fromLogin = localStorage.getItem(LS_USER_EMAIL_KEY) ?? "";
    if (fromLogin) return matchesDevEmail(fromLogin);
  } catch (_) {
    /* ignore */
  }
  const email =
    typeof userOrEmail === "string"
      ? userOrEmail
      : userOrEmail?.email ?? userOrEmail?.Email ?? "";
  return matchesDevEmail(email);
}
