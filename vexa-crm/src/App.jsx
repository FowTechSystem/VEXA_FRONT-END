// src/App.jsx - CORRIGIDO COM TODAS AS ROTAS
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { ThemeProvider as CustomThemeProvider } from "./contexts/ThemeContext";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Caixa from "./pages/Caixa";
import Vendas from "./pages/Vendas";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Compras from "./pages/Compras";
import Fornecedores from "./pages/Fornecedores";
import Financeiro from "./pages/Financeiro";
import Fiscal from "./pages/Fiscal";
import Usuarios from "./pages/Usuarios";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <CustomThemeProvider>
      <ThemeProvider theme={(theme) => theme}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "10px",
                background: "#fff",
                color: "#1a1a1a",
                padding: "16px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                fontSize: "14px",
                maxWidth: "500px",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />

          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="caixa" element={<Caixa />} />
              <Route path="vendas" element={<Vendas />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="compras" element={<Compras />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="fiscal" element={<Fiscal />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </CustomThemeProvider>
  );
}

export default App;
