// src/contexts/EmpresaContext.jsx
// Contexto para dev entrar em uma empresa e trocar de empresa.
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "../api/authService";
import { listarEmpresas } from "../api/empresasService";
import { isDevAdminUser } from "../constants/devAdmin";
import { AUTH_CHANGED_EVENT } from "../utils/authEvents";

const EMPRESA_ATIVA_KEY = "empresaAtiva";

const EmpresaContext = createContext(null);

export function EmpresaProvider({ children }) {
  /** Força novo render após login/logout (Provider não remonta na navegação /login → /). */
  const [, setAuthTick] = useState(0);
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
  const isDev = isDevAdminUser(user);

  const setEmpresaAtiva = useCallback((empresa) => {
    if (!isDevAdminUser(authService.getUsuario())) return;
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

  useEffect(() => {
    const bump = () => setAuthTick((n) => n + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, bump);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, bump);
  }, []);

  /** Usuário comum não deve manter empresa “ativa” do painel dev no storage. */
  useEffect(() => {
    if (!isDev) {
      localStorage.removeItem(EMPRESA_ATIVA_KEY);
      setEmpresaAtivaState(null);
      setEmpresas([]);
    }
  }, [isDev]);

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
