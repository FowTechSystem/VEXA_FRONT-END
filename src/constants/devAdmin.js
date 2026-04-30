/**
 * Conta de desenvolvimento / super-admin usada no front para painel multi-empresa
 * e rota de Configurações. O backend deve validar as mesmas regras.
 */
export const DEV_ADMIN_EMAIL = "dev@gmail.com";

export function isDevAdminUser(userOrEmail) {
  const email =
    typeof userOrEmail === "string"
      ? userOrEmail
      : userOrEmail?.email ?? userOrEmail?.Email ?? "";
  return String(email).trim().toLowerCase() === DEV_ADMIN_EMAIL;
}
