// src/components/Layout/Sidebar.jsx
import React, { useState, useMemo } from "react";
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
  TextField,
  InputAdornment,
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
  AssignmentReturn,
  PointOfSale,
  CardMembership,
  Search,
  Business,
  Category,
  Label,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../api/authService";
import { useEmpresa } from "../../contexts/EmpresaContext";

const drawerWidth = 260;
const DEV_ADMIN_EMAIL = "dev@gmail.com";

const menuSectionsBase = [
  {
    title: "Visão Geral",
    items: [{ text: "Dashboard", icon: <Dashboard />, path: "/" }],
  },
  {
    title: "Operação",
    items: [
      { text: "Vendas", icon: <PointOfSale />, path: "caixa" },
      { text: "Caixa", icon: <ShoppingCart />, path: "vendas" },
      { text: "Condicional", icon: <AssignmentReturn />, path: "condicional" },
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
      { text: "Categorias", icon: <Category />, path: "categorias" },
      { text: "Marcas", icon: <Label />, path: "marcas" },
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
  const [pesquisa, setPesquisa] = useState("");
  const user = authService.getUsuario();
  const { empresaAtiva } = useEmpresa();
  const isDevAdmin = user.email === DEV_ADMIN_EMAIL;
  const menuSections = useMemo(() => {
    if (!isDevAdmin) return menuSectionsBase;
    return [
      ...menuSectionsBase,
      {
        title: "Administração",
        items: [{ text: "Empresas", icon: <Business />, path: "empresas" }],
      },
    ];
  }, [isDevAdmin]);

  const isActive = (path) =>
    location.pathname === (path.startsWith("/") ? path : "/" + path);

  const menuFiltrado = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return menuSections;
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.text.toLowerCase().includes(termo)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [pesquisa, menuSections]);

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

      {/* Pesquisa */}
      <Box sx={{ px: 1.5, py: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Pesquisa"
          placeholder="Buscar menu (ex.: cli, fiscal)"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.default",
              borderRadius: 2,
            },
          }}
        />
      </Box>

      <Divider />

      {/* Menu */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <List sx={{ px: 1, pt: 2 }}>
          {menuFiltrado.map((section) => (
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
        {(empresaAtiva ? (empresaAtiva.nome || empresaAtiva.nomeFantasia) : user.empresaNome) && (
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ fontWeight: 600 }}
          >
            {empresaAtiva ? (empresaAtiva.nome || empresaAtiva.nomeFantasia || `Empresa #${empresaAtiva.id}`) : user.empresaNome}
          </Typography>
        )}
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
