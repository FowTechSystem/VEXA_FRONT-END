// src/utils/notifications.js
// Sistema padronizado de notificações e avisos - use em todo o sistema.
// Nunca exibe localhost, URLs ou mensagens técnicas ao usuário.
import toast from "react-hot-toast";

const EVENT_CRITICAL_ERROR = "vexa-critical-error";

// Mensagens amigáveis quando detectar erro de rede/servidor
const FALLBACK_NETWORK = "Não foi possível conectar. Verifique sua conexão e tente novamente.";
const FALLBACK_SERVER = "Ocorreu um erro no servidor. Tente novamente mais tarde.";
const FALLBACK_GENERIC = "Ocorreu um erro inesperado. Tente novamente.";

/**
 * Sanitiza a mensagem para nunca exibir localhost, URLs ou detalhes técnicos ao usuário.
 * Use sempre antes de exibir qualquer erro vindo de API/catch.
 */
export const sanitizeMessage = (message) => {
  if (message == null || typeof message !== "string") {
    return FALLBACK_GENERIC;
  }
  const msg = String(message).trim();
  if (msg.length === 0) return FALLBACK_GENERIC;

  const lower = msg.toLowerCase();
  // Erros de rede / conexão
  if (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("econnrefused") ||
    lower.includes("err_network") ||
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("axios")
  ) {
    return FALLBACK_NETWORK;
  }
  if (
    lower.includes("econnaborted") ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return "A requisição demorou muito. Tente novamente.";
  }
  // Erro do servidor (500, etc.)
  if (lower.includes("500") || lower.includes("internal server error")) {
    return FALLBACK_SERVER;
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return "Recurso não encontrado.";
  }
  if (lower.includes("401") || lower.includes("unauthorized")) {
    return "Sessão expirada. Faça login novamente.";
  }
  if (lower.includes("403") || lower.includes("forbidden")) {
    return "Você não tem permissão para esta ação.";
  }
  // Evita expor URLs ou stack
  if (lower.includes("http://") || lower.includes("https://") || lower.includes(" at ") || lower.includes(".js:")) {
    return FALLBACK_GENERIC;
  }
  // Limita tamanho para não exibir blocos enormes
  if (msg.length > 200) {
    return msg.substring(0, 197).trim() + "...";
  }
  return msg;
};

// Estilos de fundo/cor vêm do Toaster em App.jsx (tema claro/escuro)
const defaultOptions = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "10px",
    padding: "16px",
    maxWidth: "500px",
  },
};

export const showSuccess = (message) => {
  const text = typeof message === "string" ? message : (message && message.message) || "Operação concluída!";
  toast.success(text, defaultOptions);
};

export const showError = (message, options = {}) => {
  const text = sanitizeMessage(typeof message === "string" ? message : (message && message.message) || FALLBACK_GENERIC);
  toast.error(text, { ...defaultOptions, ...options });
};

/**
 * Erro grave: exibe modal no centro da tela e obriga o usuário a clicar em OK.
 * Use para falhas críticas (ex.: não conseguiu carregar dados essenciais, erro de sistema).
 */
export const showCriticalError = (message) => {
  const safe = sanitizeMessage(typeof message === "string" ? message : (message && message.message) || FALLBACK_GENERIC);
  window.dispatchEvent(
    new CustomEvent(EVENT_CRITICAL_ERROR, { detail: { message: safe } })
  );
};

export const showWarning = (message) => {
  const text = typeof message === "string" ? message : (message && message.message) || "Atenção.";
  toast(text, {
    ...defaultOptions,
    icon: "⚠️",
    style: {
      ...defaultOptions.style,
      borderLeft: "4px solid var(--toast-warning, #f59e0b)",
    },
  });
};

export const showInfo = (message) => {
  const text = typeof message === "string" ? message : (message && message.message) || "";
  toast(text, {
    ...defaultOptions,
    icon: "ℹ️",
    style: {
      ...defaultOptions.style,
      borderLeft: "4px solid var(--toast-info, #f8f32b)",
    },
  });
};

export const showLoading = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || "Carregando...",
      success: messages.success || "Operação concluída!",
      error: (err) => sanitizeMessage(err?.message || messages.error || "Algo deu errado."),
    },
    defaultOptions
  );
};

export { EVENT_CRITICAL_ERROR };
