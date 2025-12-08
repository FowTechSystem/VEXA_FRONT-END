// src/components/Layout/Sidebar.jsx
import React from "react";
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import {
  Dashboard,
  People,
  ShoppingCart,
  Inventory,
  Store,
  AccountCircle,
  Assessment,
  Settings,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 260;

const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/" },
  { text: "Clientes", icon: <People />, path: "/clientes" },
  { text: "Produtos", icon: <Inventory />, path: "/produtos" },
  { text: "Vendas", icon: <ShoppingCart />, path: "/vendas" },
  { text: "Fornecedores", icon: <Store />, path: "/fornecedores" },
  { text: "Usuários", icon: <AccountCircle />, path: "/usuarios" },
];

const secondaryItems = [
  { text: "Relatórios", icon: <Assessment />, path: "/relatorios" },
  { text: "Configurações", icon: <Settings />, path: "/configuracoes" },
];

function Sidebar({ mobileOpen, onDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Toolbar
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          VEXA
        </Typography>
      </Toolbar>

      <Divider />

      {/* Menu Principal */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List sx={{ px: 1, pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (onDrawerToggle) onDrawerToggle();
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive(item.path)
                    ? "primary.main"
                    : "transparent",
                  color: isActive(item.path) ? "white" : "inherit",
                  "&:hover": {
                    backgroundColor: isActive(item.path)
                      ? "primary.dark"
                      : "action.hover",
                  },
                  mb: 0.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? "white" : "primary.main",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Menu Secundário */}
        <List sx={{ px: 1 }}>
          {secondaryItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (onDrawerToggle) onDrawerToggle();
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive(item.path)
                    ? "primary.main"
                    : "transparent",
                  color: isActive(item.path) ? "white" : "inherit",
                  "&:hover": {
                    backgroundColor: isActive(item.path)
                      ? "primary.dark"
                      : "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? "white" : "text.secondary",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Typography
          variant="caption"
          color="textSecondary"
          align="center"
          display="block"
        >
          VEXA CRM v1.0
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          align="center"
          display="block"
        >
          © 2025 Todos os direitos reservados
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Melhor performance no mobile
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Sidebar;
