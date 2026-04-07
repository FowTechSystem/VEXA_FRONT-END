// src/components/Layout/Sidebar.jsx
import React, { useState, useMemo, useEffect } from "react";
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
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Dashboard,
  People,
  ShoppingCart,
  Inventory,
  Warehouse,
  MenuBook,
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
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../api/authService";
import { useEmpresa } from "../../contexts/EmpresaContext";

const drawerWidth = 260;
const DEV_ADMIN_EMAIL = "dev@gmail.com";

/** Rotas consideradas “dentro” do grupo Produtos (mantém submenu aberto e destaque no pai). */
const PRODUTOS_GROUP_PATHS = ["produtos", "categorias", "marcas"];

const menuSectionsBase = [
  {
    title: "Visão Geral",
    items: [{ text: "Dashboard", icon: <Dashboard />, path: "/" }],
  },
  {
    title: "Operação",
    items: [
      { text: "Catálogo Digital", icon: <MenuBook />, path: "catalogo-digital" },
      { text: "Vendas", icon: <PointOfSale />, path: "caixa" },
      { text: "Caixa", icon: <ShoppingCart />, path: "vendas" },
      { text: "Condicional", icon: <AssignmentReturn />, path: "condicional" },
    ],
  },
  {
    title: "Gestão",
    items: [
      {
        text: "Produtos",
        icon: <Inventory />,
        path: "produtos",
        children: [
          { text: "Categorias", icon: <Category />, path: "categorias" },
          { text: "Marcas", icon: <Label />, path: "marcas" },
        ],
      },
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

function isProdutosGroupActive(pathname) {
  return PRODUTOS_GROUP_PATHS.some((p) => {
    const normalized = `/${p}`;
    return pathname === normalized || pathname.startsWith(`${normalized}/`);
  });
}

function filterMenuSections(sections, termo) {
  const t = termo.trim().toLowerCase();
  if (!t) return sections;

  return sections
    .map((section) => {
      const items = section.items
        .map((item) => {
          if (item.children?.length) {
            const parentHit = item.text.toLowerCase().includes(t);
            const matchedChildren = item.children.filter((c) =>
              c.text.toLowerCase().includes(t),
            );
            if (parentHit) return { ...item, children: item.children };
            if (matchedChildren.length)
              return { ...item, children: matchedChildren };
            return null;
          }
          return item.text.toLowerCase().includes(t) ? item : null;
        })
        .filter(Boolean);

      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);
}

function Sidebar({ mobileOpen, onDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pesquisa, setPesquisa] = useState("");
  const [produtosSubmenuOpen, setProdutosSubmenuOpen] = useState(false);
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

  const menuFiltrado = useMemo(
    () => filterMenuSections(menuSections, pesquisa),
    [pesquisa, menuSections],
  );

  const pesquisaAtiva = pesquisa.trim().length > 0;

  const pesquisaMostraSubmenuProdutos = useMemo(() => {
    if (!pesquisaAtiva) return false;
    const gestao = menuFiltrado.find((s) => s.title === "Gestão");
    return !!gestao?.items.some(
      (i) => i.text === "Produtos" && i.children?.length,
    );
  }, [menuFiltrado, pesquisaAtiva]);

  useEffect(() => {
    if (isProdutosGroupActive(location.pathname)) {
      setProdutosSubmenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (pesquisaMostraSubmenuProdutos) {
      setProdutosSubmenuOpen(true);
    }
  }, [pesquisaMostraSubmenuProdutos]);

  const isActive = (path) =>
    location.pathname === (path.startsWith("/") ? path : `/${path}`);

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
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

      <Box sx={{ px: 1.5, py: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Pesquisa"
          placeholder="Buscar menu (ex.: prod, categoria, marca)"
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

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { display: "none" },
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

              {section.items.map((item) => {
                if (item.children?.length) {
                  const parentActive =
                    isActive(item.path) || isProdutosGroupActive(location.pathname);
                  const open =
                    produtosSubmenuOpen || (pesquisaAtiva && parentActive);

                  return (
                    <Box key={item.text}>
                      <ListItem
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            aria-label={open ? "Recolher submenu" : "Expandir submenu"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProdutosSubmenuOpen((v) => !v);
                            }}
                            sx={{ mr: 0.5, color: "text.secondary" }}
                          >
                            {open ? (
                              <ExpandLess fontSize="small" />
                            ) : (
                              <ExpandMore fontSize="small" />
                            )}
                          </IconButton>
                        }
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        <ListItemButton
                          onClick={() => {
                            navigate(`/${item.path}`);
                            setProdutosSubmenuOpen(true);
                            if (onDrawerToggle) onDrawerToggle();
                          }}
                          sx={{
                            borderRadius: 2,
                            pr: 5,
                            bgcolor: parentActive ? "primary.main" : "transparent",
                            color: parentActive ? "white" : "text.primary",
                            "&:hover": {
                              bgcolor: parentActive
                                ? "primary.dark"
                                : "action.hover",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 40,
                              color: parentActive ? "white" : "text.secondary",
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: parentActive ? 600 : 400,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>

                      <Collapse in={open} timeout="auto" unmountOnExit={false}>
                        <List component="div" disablePadding sx={{ pl: 1.5 }}>
                          {item.children.map((sub) => {
                            const subActive = isActive(sub.path);
                            return (
                              <ListItem key={sub.path} disablePadding sx={{ mb: 0.25 }}>
                                <ListItemButton
                                  onClick={() => {
                                    navigate(`/${sub.path}`);
                                    if (onDrawerToggle) onDrawerToggle();
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    pl: 2,
                                    py: 0.75,
                                    bgcolor: subActive ? "action.selected" : "transparent",
                                    color: "text.primary",
                                    "&:hover": {
                                      bgcolor: subActive
                                        ? "action.selected"
                                        : "action.hover",
                                    },
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 36,
                                      color: subActive ? "primary.main" : "text.secondary",
                                    }}
                                  >
                                    {sub.icon}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={sub.text}
                                    primaryTypographyProps={{
                                      variant: "body2",
                                      fontWeight: subActive ? 600 : 400,
                                      fontSize: "0.875rem",
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    </Box>
                  );
                }

                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path.startsWith("/") ? item.path : `/${item.path}`);
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
                );
              })}
            </Box>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
        >
          VEXA v1.0
        </Typography>
        {(empresaAtiva
          ? empresaAtiva.nome || empresaAtiva.nomeFantasia
          : user.empresaNome) && (
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ fontWeight: 600 }}
          >
            {empresaAtiva
              ? empresaAtiva.nome ||
                empresaAtiva.nomeFantasia ||
                `Empresa #${empresaAtiva.id}`
              : user.empresaNome}
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
