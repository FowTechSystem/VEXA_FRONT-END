// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom"; // ADICIONE ESTE IMPORT
import Header from "./Header";
import Sidebar from "./Sidebar";

function MainLayout() {
  // REMOVA o {children} do parâmetro
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Header */}
      <Header onMenuClick={handleDrawerToggle} />

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Outlet /> {/* TROQUE {children} por <Outlet /> */}
      </Box>
    </Box>
  );
}

export default MainLayout;
