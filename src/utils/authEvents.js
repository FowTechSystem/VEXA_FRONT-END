/** Evento disparado após login/logout para contextos re-renderizarem (ex.: EmpresaProvider). */
export const AUTH_CHANGED_EVENT = "vexa-auth-changed";

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
