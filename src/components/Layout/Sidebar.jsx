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
  Warehouse,
  AccountCircle,
  Assessment,
  Settings,
  ShoppingBag,
  AttachMoney,
  Receipt,
  LocalShipping,
  PointOfSale,
  CardMembership,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 260;

const menuSections = [
  {
    title: "Visão Geral",
    items: [{ text: "Dashboard", icon: <Dashboard />, path: "/" }],
  },
  {
    title: "Operação",
    items: [
      { text: "Vendas", icon: <PointOfSale />, path: "caixa" },
      { text: "Caixa", icon: <ShoppingCart />, path: "vendas" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { text: "Produtos", icon: <Inventory />, path: "produtos" },
      { text: "Estoque", icon: <Warehouse />, path: "estoque" },
      { text: "Compras", icon: <ShoppingBag />, path: "compras" },
    ],
  },
  {
    title: "Financeiro & Fiscal",
    items: [
      { text: "Financeiro", icon: <AttachMoney />, path: "financeiro" },
      { text: "Fiscal", icon: <Receipt />, path: "fiscal" },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { text: "Usuários", icon: <AccountCircle />, path: "usuarios" },
      { text: "Clientes", icon: <People />, path: "clientes" },
      { text: "Fornecedores", icon: <LocalShipping />, path: "fornecedores" },
    ],
  },
  {
    title: "Análises",
    items: [{ text: "Relatórios", icon: <Assessment />, path: "relatorios" }],
  },
  {
    title: "Sistema",
    items: [
      { text: "Planos", icon: <CardMembership />, path: "planos" },
      { text: "Configurações", icon: <Settings />, path: "configuracoes" },
    ],
  },
];

function Sidebar({ mobileOpen, onDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === (path.startsWith("/") ? path : "/" + path);

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* Logo */}
      <Toolbar
        sx={{
          bgcolor: "primary.main",
          color: "white",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" fontWeight={700} letterSpacing={2}>
          VEXA
        </Typography>
      </Toolbar>

      <Divider />

      {/* Menu */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          // Esconde a scrollbar em todos os navegadores
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <List sx={{ px: 1, pt: 2 }}>
          {menuSections.map((section) => (
            <Box key={section.title} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  mb: 0.5,
                  color: "text.secondary",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {section.title}
              </Typography>

              {section.items.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (onDrawerToggle) onDrawerToggle();
                    }}
                    sx={{
                      borderRadius: 2,
                      bgcolor: isActive(item.path)
                        ? "primary.main"
                        : "transparent",
                      color: isActive(item.path) ? "white" : "text.primary",
                      "&:hover": {
                        bgcolor: isActive(item.path)
                          ? "primary.dark"
                          : "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isActive(item.path) ? "white" : "text.secondary",
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
            </Box>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
        >
          VEXA v1.0
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
        >
          © 2026 Todos os direitos reservados
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: "background.paper",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Sidebar;
