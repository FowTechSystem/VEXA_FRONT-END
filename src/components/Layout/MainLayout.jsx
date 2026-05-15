// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import { Box, useTheme } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { InAppNotificationProvider } from "../../contexts/InAppNotificationContext";

function MainLayout() {
  const theme = useTheme();
  const location = useLocation();
  // Rotas fullscreen sem padding lateral (PDV/operacionais)
  const fullscreenRoutes = ["/vendas", "/condicional", "/caixa", "/catalogo-digital"];
  const isFullscreen = fullscreenRoutes.includes(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <InAppNotificationProvider>
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      <Header onMenuClick={handleDrawerToggle} />

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          p: isFullscreen ? 0 : 3,
          mt: 8,
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.default,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          color: theme.palette.text.primary,
        }}
      >
        <Outlet />
      </Box>
    </Box>
    </InAppNotificationProvider>
  );
}

export default MainLayout;
