// src/components/Layout/Header.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Brightness4,
  Brightness7,
  Business,
  SwapHoriz,
  ExitToApp,
} from "@mui/icons-material";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useEmpresa } from "../../contexts/EmpresaContext";
import UserProfileDrawer from "../UserProfileDrawer";
import { authService } from "../../api/authService";

// Notificações exibidas no painel (pode ser conectado a um contexto/API depois)
const NOTIFICACOES_INICIAIS = [
  { id: 1, titulo: "Nova venda", texto: "Venda #1245 finalizada com sucesso.", data: "Há 5 min", lida: false },
  { id: 2, titulo: "Estoque baixo", texto: "Produto Camiseta Básica abaixo do mínimo.", data: "Há 1 h", lida: false },
  { id: 3, titulo: "Relatório disponível", texto: "Relatório de vendas do mês está pronto.", data: "Ontem", lida: false },
  { id: 4, titulo: "Atualização do sistema", texto: "VEXA atualizado para a versão 1.0.", data: "Ontem", lida: false },
];

function Header({ onMenuClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const [anchorEmpresa, setAnchorEmpresa] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificacoes] = useState(NOTIFICACOES_INICIAIS);
  const { mode, toggleTheme } = useContext(ThemeContext);
  const { empresaAtiva, empresas, setEmpresaAtiva, sairEmpresa, isDev } = useEmpresa();
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event) => {
    setAnchorNotif(event.currentTarget);
  };

  const handleNotifClose = () => {
    setAnchorNotif(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

  // FUNÇÃO PARA ABRIR O DRAWER
  const handleOpenProfile = () => {
    setDrawerOpen(true);
    handleClose();
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          ...(isDark
            ? {
                backgroundColor: "background.paper",
                color: "text.primary",
                borderBottom: "2px solid",
                borderColor: "primary.main",
                boxShadow: `0 4px 24px ${alpha("#000000", 0.35)}`,
              }
            : {
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: 1,
              color: isDark ? "primary.main" : "inherit",
            }}
          >
            VEXA
          </Typography>
          {/* Label da empresa atual */}
          {(() => {
            const user = authService.getUsuario();
            let empresaLabel = null;
            if (empresaAtiva) {
              empresaLabel = empresaAtiva.nome || empresaAtiva.nomeFantasia || `Empresa #${empresaAtiva.id}`;
            } else {
              empresaLabel = user.empresaNome || (user.empresaId != null ? `Empresa #${user.empresaId}` : null);
            }
            if (!empresaLabel && !isDev) return null;
            return (
              <Typography variant="caption" sx={{ opacity: isDark ? 1 : 0.9, mr: 1, color: isDark ? "text.secondary" : "inherit" }}>
                {empresaLabel || "Painel dev"}
              </Typography>
            );
          })()}
          {/* Troca de empresa (só para dev) */}
          {isDev && (
            <>
              <Box
                component="button"
                onClick={(e) => setAnchorEmpresa(e.currentTarget)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: isDark ? "divider" : "rgba(255,255,255,0.3)",
                  bgcolor: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  "&:hover": {
                    bgcolor: isDark ? "action.hover" : "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <SwapHoriz fontSize="small" />
                {empresaAtiva ? "Trocar empresa" : "Entrar em empresa"}
              </Box>
              <Menu
                anchorEl={anchorEmpresa}
                open={Boolean(anchorEmpresa)}
                onClose={() => setAnchorEmpresa(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{ sx: { minWidth: 260, maxHeight: 360 } }}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEmpresa(null);
                    navigate("/empresas");
                  }}
                >
                  <Business sx={{ mr: 1 }} />
                  Painel de empresas
                </MenuItem>
                <Divider />
                {empresas.map((e) => (
                  <MenuItem
                    key={e.id}
                    onClick={() => {
                      setEmpresaAtiva(e);
                      setAnchorEmpresa(null);
                      navigate("/");
                    }}
                    selected={empresaAtiva?.id === e.id}
                  >
                    {e.nome || e.nomeFantasia || `Empresa #${e.id}`}
                  </MenuItem>
                ))}
                {empresaAtiva && (
                  <>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        sairEmpresa();
                        setAnchorEmpresa(null);
                        navigate("/");
                      }}
                      sx={{ color: "error.main" }}
                    >
                      <ExitToApp sx={{ mr: 1 }} />
                      Sair da empresa
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              onClick={() => {
                console.log("Botão de tema clicado! Modo atual:", mode);
                toggleTheme();
              }}
              title={
                mode === "dark"
                  ? "Mudar para tema claro"
                  : "Mudar para tema escuro"
              }
              sx={{
                "&:hover": {
                  backgroundColor: (t) => t.palette.action.hover,
                },
              }}
            >
              {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
            </IconButton>

            <IconButton color="inherit" onClick={handleNotifOpen} title="Notificações">
              <Badge badgeContent={notificacoes.filter((n) => !n.lida).length} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={handleMenu} color="inherit" title={(() => {
                const u = authService.getUsuario();
                return u.empresaNome || (u.empresaId != null ? `Empresa #${u.empresaId}` : "Conta");
              })()}>
                <Avatar
                  sx={{
                    width: 35,
                    height: 35,
                    backgroundColor: "secondary.main",
                  }}
                >
                  {(() => {
                    const u = authService.getUsuario();
                    const nome = u.empresaNome || (u.empresaId != null ? `Empresa ${u.empresaId}` : "Conta");
                    return nome.charAt(0).toUpperCase();
                  })()}
                </Avatar>
              </IconButton>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {(() => {
                const u = authService.getUsuario();
                const empresaLabel = u.empresaNome || (u.empresaId != null ? `Empresa #${u.empresaId}` : null);
                return empresaLabel ? (
                  <MenuItem disabled sx={{ opacity: 1, cursor: "default" }}>
                    <Typography variant="body2" fontWeight={600}>{empresaLabel}</Typography>
                  </MenuItem>
                ) : null;
              })()}
              <MenuItem onClick={handleOpenProfile}>
                <AccountCircle sx={{ mr: 1 }} />
                Meu Perfil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Sair
              </MenuItem>
            </Menu>

            {/* Painel de notificações */}
            <Menu
              anchorEl={anchorNotif}
              open={Boolean(anchorNotif)}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: {
                    width: 380,
                    maxWidth: "95vw",
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: 8,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Notificações
                </Typography>
              </Box>
              <List sx={{ py: 0, maxHeight: 360, overflow: "auto" }}>
                {notificacoes.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="Nenhuma notificação"
                      secondary="Você está em dia."
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ) : (
                  notificacoes.map((n, i) => (
                    <React.Fragment key={n.id}>
                      {i > 0 && <Divider component="li" />}
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                        onClick={handleNotifClose}
                      >
                        <ListItemText
                          primary={n.titulo}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.secondary" display="block">
                                {n.texto}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary">
                                {n.data}
                              </Typography>
                            </>
                          }
                          primaryTypographyProps={{
                            variant: "subtitle2",
                            fontWeight: n.lida ? 400 : 600,
                          }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                )}
              </List>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* DRAWER LATERAL */}
      <UserProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

export default Header;
