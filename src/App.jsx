// src/App.jsx - CORRIGIDO E COMPLETO
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import {
  ThemeProvider as CustomThemeProvider,
  ThemeContext,
} from "./contexts/ThemeContext";
import CriticalErrorDialog from "./components/CriticalErrorDialog";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Home from "./pages/Home";
import Caixa from "./pages/Caixa";
import Vendas from "./pages/Vendas";
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
import ModuleRoute from "./components/Auth/ModuleRoute";
import Categorias from "./pages/Categorias";
import Marcas from "./pages/Marcas";
import CatalogoDigital from "./pages/CatalogoDigital";
import CatalogoPublico from "./pages/CatalogoPublico";
import Bazar from "./pages/Bazar";
import BazarConsignante from "./pages/BazarConsignante";
import BazarConsignantePecas from "./pages/BazarConsignantePecas";
import BazarRepasses from "./pages/BazarRepasses";
import ProtectedRoute from "./components/ProtectedRoute";
import { EmpresaProvider } from "./contexts/EmpresaContext";
import { CompanySettingsProvider } from "./contexts/CompanySettingsContext";
import { vexaColors, vexaSurfaces } from "./theme";

function AppContent() {
  const { mode } = useContext(ThemeContext);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
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
                  mode === "dark"
                    ? vexaSurfaces.darkPaper
                    : vexaSurfaces.lightPaper,
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
                    mode === "dark"
                      ? vexaSurfaces.darkPaper
                      : vexaSurfaces.lightPaper,
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
                    mode === "dark"
                      ? vexaSurfaces.darkPaper
                      : vexaSurfaces.lightPaper,
                },
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
              loading: {
                style: {
                  background:
                    mode === "dark"
                      ? vexaSurfaces.darkPaper
                      : vexaSurfaces.lightPaper,
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
              <Route index element={<Home />} />
              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route
                path="vendas/nova-movimentacao"
                element={<Navigate to="/caixa?novaMov=1" replace />}
              />
              <Route
                path="vendas"
                element={<ModuleRoute moduleKey="vendas"><Caixa /></ModuleRoute>}
              />
              <Route
                path="caixa/nova-movimentacao"
                element={<Navigate to="/caixa?novaMov=1" replace />}
              />
              <Route
                path="caixa"
                element={<ModuleRoute moduleKey="caixa"><Vendas /></ModuleRoute>}
              />
              <Route
                path="produtos"
                element={<ModuleRoute moduleKey="produtos"><Produtos /></ModuleRoute>}
              />
              <Route
                path="estoque"
                element={<ModuleRoute moduleKey="estoque"><Estoque /></ModuleRoute>}
              />
              <Route
                path="compras"
                element={<ModuleRoute moduleKey="compras"><Compras /></ModuleRoute>}
              />
              <Route
                path="fiscal"
                element={<ModuleRoute moduleKey="fiscal"><Fiscal /></ModuleRoute>}
              />
              <Route
                path="clientes"
                element={<ModuleRoute moduleKey="clientes"><Clientes /></ModuleRoute>}
              />
              <Route
                path="fornecedores"
                element={<ModuleRoute moduleKey="fornecedores"><Fornecedores /></ModuleRoute>}
              />
              <Route
                path="categorias"
                element={<ModuleRoute moduleKey="produtos"><Categorias /></ModuleRoute>}
              />
              <Route
                path="marcas"
                element={<ModuleRoute moduleKey="produtos"><Marcas /></ModuleRoute>}
              />
              <Route path="usuarios" element={<Usuarios />} />
              <Route
                path="relatorios"
                element={<ModuleRoute moduleKey="relatorios"><Relatorios /></ModuleRoute>}
              />
              <Route
                path="condicional"
                element={<ModuleRoute moduleKey="condicional"><Condicional /></ModuleRoute>}
              />
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
              <Route
                path="catalogo-digital"
                element={<ModuleRoute moduleKey="catalogo"><CatalogoDigital /></ModuleRoute>}
              />

              {/* Módulo Bazar */}
              <Route
                path="bazar"
                element={<ModuleRoute moduleKey="bazar"><Bazar /></ModuleRoute>}
              />
              <Route
                path="bazar/consignante/:id"
                element={<ModuleRoute moduleKey="bazar"><BazarConsignante /></ModuleRoute>}
              />
              <Route
                path="bazar/consignante/:id/pecas"
                element={<ModuleRoute moduleKey="bazar"><BazarConsignantePecas /></ModuleRoute>}
              />
              <Route
                path="bazar/repasses"
                element={<ModuleRoute moduleKey="repasses"><BazarRepasses /></ModuleRoute>}
              />
            </Route>

            {/* Rota 404 - Redireciona para Login (exceto catálogo público) */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </EmpresaProvider>
    </LocalizationProvider>
  );
}

function App() {
  return (
    <CompanySettingsProvider>
      <CustomThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <AppContent />
        </LocalizationProvider>
      </CustomThemeProvider>
    </CompanySettingsProvider>
  );
}

export default App;
