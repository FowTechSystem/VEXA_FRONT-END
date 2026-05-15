// src/App.jsx - CORRIGIDO E COMPLETO
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  ThemeProvider as CustomThemeProvider,
  ThemeContext,
} from "./contexts/ThemeContext";
import CriticalErrorDialog from "./components/CriticalErrorDialog";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Caixa from "./pages/Caixa";
import Vendas from "./pages/Vendas";
import NovaMovimentacaoCaixa from "./pages/NovaMovimentacaoCaixa";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Compras from "./pages/Compras";
import Fornecedores from "./pages/Fornecedores";
import Fiscal from "./pages/Fiscal";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Relatorios from "./pages/Relatorios";
import Condicional from "./pages/Condicional";
import Empresas from "./pages/Empresas";
import DevOnlyRoute from "./components/Auth/DevOnlyRoute";
import AdminSettingsRoute from "./components/Auth/AdminSettingsRoute";
import Categorias from "./pages/Categorias";
import Marcas from "./pages/Marcas";
import CatalogoDigital from "./pages/CatalogoDigital";
import CatalogoPublico from "./pages/CatalogoPublico";
import ProtectedRoute from "./components/ProtectedRoute";
import { EmpresaProvider } from "./contexts/EmpresaContext";
import { vexaColors, vexaSurfaces } from "./theme";

function AppContent() {
  const { mode } = useContext(ThemeContext);

  return (
    <EmpresaProvider>
    <BrowserRouter>
      <CriticalErrorDialog />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            padding: "16px",
            fontSize: "14px",
            maxWidth: "500px",
            background:
              mode === "dark" ? vexaSurfaces.darkPaper : vexaSurfaces.lightPaper,
            color: mode === "dark" ? "#ECEEF4" : vexaColors.azulEscuro,
            border:
              mode === "dark"
                ? `1px solid rgba(141, 153, 174, 0.22)`
                : `1px solid rgba(43, 45, 66, 0.08)`,
          },
          success: {
            duration: 2500,
            style: {
              background:
                mode === "dark" ? vexaSurfaces.darkPaper : vexaSurfaces.lightPaper,
            },
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 3500,
            style: {
              background:
                mode === "dark" ? vexaSurfaces.darkPaper : vexaSurfaces.lightPaper,
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
          loading: {
            style: {
              background:
                mode === "dark" ? vexaSurfaces.darkPaper : vexaSurfaces.lightPaper,
            },
          },
        }}
      />

      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/catalogo-publico/:id" element={<CatalogoPublico />} />

        {/* Rotas Protegidas (com sidebar) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="home" element={<Home />} />
          <Route path="vendas/nova-movimentacao" element={<Navigate to="/caixa/nova-movimentacao" replace />} />
          <Route path="vendas" element={<Caixa />} />
          <Route path="caixa/nova-movimentacao" element={<NovaMovimentacaoCaixa />} />
          <Route path="caixa" element={<Vendas />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="compras" element={<Compras />} />
          <Route path="fiscal" element={<Fiscal />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="marcas" element={<Marcas />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="condicional" element={<Condicional />} />
          <Route
            path="empresas"
            element={
              <DevOnlyRoute>
                <Empresas />
              </DevOnlyRoute>
            }
          />
          <Route
            path="configuracoes"
            element={
              <AdminSettingsRoute>
                <Configuracoes />
              </AdminSettingsRoute>
            }
          />
          <Route path="catalogo-digital" element={<CatalogoDigital />} />
        </Route>

        {/* Rota 404 - Redireciona para Login (exceto catálogo público) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </EmpresaProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

export default App;
