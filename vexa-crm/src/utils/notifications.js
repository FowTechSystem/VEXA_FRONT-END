// src/utils/notifications.js
import toast from "react-hot-toast";

const defaultOptions = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "10px",
    background: "#fff",
    color: "#1a1a1a",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
};

export const showSuccess = (message) => {
  toast.success(message, {
    ...defaultOptions,
    iconTheme: {
      primary: "#10b981",
      secondary: "#fff",
    },
  });
};

export const showError = (message) => {
  toast.error(message, {
    ...defaultOptions,
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fff",
    },
  });
};

export const showWarning = (message) => {
  toast(message, {
    ...defaultOptions,
    icon: "⚠️",
    style: {
      ...defaultOptions.style,
      borderLeft: "4px solid #f59e0b",
    },
  });
};

export const showInfo = (message) => {
  toast(message, {
    ...defaultOptions,
    icon: "ℹ️",
    style: {
      ...defaultOptions.style,
      borderLeft: "4px solid #3b82f6",
    },
  });
};

export const showLoading = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || "Carregando...",
      success: messages.success || "Operação concluída!",
      error: messages.error || "Algo deu errado.",
    },
    defaultOptions
  );
};
