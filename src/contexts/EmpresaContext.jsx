// src/contexts/EmpresaContext.jsx
// Contexto para dev entrar em uma empresa e trocar de empresa.
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "../api/authService";
import { listarEmpresas } from "../api/empresasService";

const DEV_ADMIN_EMAIL = "dev@gmail.com";
const EMPRESA_ATIVA_KEY = "empresaAtiva";

const EmpresaContext = createContext(null);

export function EmpresaProvider({ children }) {
  const [empresaAtiva, setEmpresaAtivaState] = useState(() => {
    try {
      const raw = localStorage.getItem(EMPRESA_ATIVA_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const user = authService.getUsuario();
  const isDev = user.email === DEV_ADMIN_EMAIL;

  const setEmpresaAtiva = useCallback((empresa) => {
    if (empresa) {
      localStorage.setItem(EMPRESA_ATIVA_KEY, JSON.stringify(empresa));
    } else {
      localStorage.removeItem(EMPRESA_ATIVA_KEY);
    }
    setEmpresaAtivaState(empresa);
  }, []);

  const sairEmpresa = useCallback(() => {
    localStorage.removeItem(EMPRESA_ATIVA_KEY);
    setEmpresaAtivaState(null);
  }, []);

  const loadEmpresas = useCallback(async () => {
    if (!isDev) return;
    setLoadingEmpresas(true);
    try {
      const data = await listarEmpresas();
      setEmpresas(Array.isArray(data) ? data : data.empresas || data.items || []);
    } catch (err) {
      console.warn("Erro ao listar empresas:", err);
      setEmpresas([]);
    } finally {
      setLoadingEmpresas(false);
    }
  }, [isDev]);

  useEffect(() => {
    if (isDev) loadEmpresas();
  }, [isDev, loadEmpresas]);

  const value = {
    empresaAtiva,
    empresas,
    setEmpresaAtiva,
    sairEmpresa,
    loadEmpresas,
    loadingEmpresas,
    isDev,
  };

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) {
    throw new Error("useEmpresa deve ser usado dentro de EmpresaProvider");
  }
  return ctx;
}
