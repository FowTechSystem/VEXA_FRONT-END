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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { ThemeContext } from "../../contexts/ThemeContext";
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificacoes] = useState(NOTIFICACOES_INICIAIS);
  const { mode, toggleTheme } = useContext(ThemeContext);
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
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "primary.main",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
            }}
          >
            VEXA
          </Typography>

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
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
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
              <IconButton onClick={handleMenu} color="inherit">
                <Avatar
                  sx={{
                    width: 35,
                    height: 35,
                    backgroundColor: "secondary.main",
                  }}
                >
                  A
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
