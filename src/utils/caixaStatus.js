// src/utils/caixaStatus.js
// Estado de abertura do Caixa armazenado no front (localStorage) por usuário.
// Quando o caixa não está aberto, vendas/movimentações ficam bloqueadas no front.
import { authService } from "../api/authService";

const PREFIX = "vexa_caixa_status_";

/** Disparado ao abrir/fechar o caixa (mesma aba ou outras, via storage). */
export const CAIXA_CHANGED_EVENT = "vexa-caixa-changed";

export function notifyCaixaChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CAIXA_CHANGED_EVENT));
}

function userKey() {
  try {
    const u = authService.getUsuario?.();
    const id = u?.email ?? u?.Email ?? u?.id ?? u?.Id ?? "default";
    return `${PREFIX}${String(id)}`;
  } catch {
    return `${PREFIX}default`;
  }
}

export function getCaixaStatus() {
  try {
    const raw = localStorage.getItem(userKey());
    if (!raw) return { aberto: false };
    const parsed = JSON.parse(raw);
    return { aberto: !!parsed.aberto, ...parsed };
  } catch {
    return { aberto: false };
  }
}

export function isCaixaAberto() {
  return !!getCaixaStatus().aberto;
}

export function abrirCaixa({ valorInicial = 0 } = {}) {
  const payload = {
    aberto: true,
    dataAbertura: new Date().toISOString(),
    valorInicial: Number(valorInicial) || 0,
  };
  localStorage.setItem(userKey(), JSON.stringify(payload));
  notifyCaixaChanged();
  return payload;
}

export function fecharCaixa() {
  const atual = getCaixaStatus();
  const payload = {
    aberto: false,
    dataAbertura: atual.dataAbertura ?? null,
    valorInicial: atual.valorInicial ?? 0,
    dataFechamento: new Date().toISOString(),
  };
  localStorage.setItem(userKey(), JSON.stringify(payload));
  notifyCaixaChanged();
  return payload;
}
