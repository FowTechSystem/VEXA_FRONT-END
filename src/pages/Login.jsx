// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import { showError } from "../utils/notifications";
import { authService } from "../api/authService";

const DEMO_SEM_BACKEND = false;

const MSG_CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos. Verifique e tente novamente.";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openAviso, setOpenAviso] = useState(false);
  const [mensagemAviso, setMensagemAviso] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useContext(ThemeContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email?.trim() || !password) {
      setMensagemAviso("Preencha e-mail e senha para continuar.");
      setOpenAviso(true);
      return;
    }

    setLoading(true);

    try {
      await authService.login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (error) {
      if (DEMO_SEM_BACKEND && error.code === "ERR_NETWORK") {
        localStorage.setItem("token", "demo-token");
        localStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", email);
        navigate("/", { replace: true });
        return;
      }

      if (error.response?.status === 401) {
        setMensagemAviso(MSG_CREDENCIAIS_INVALIDAS);
        setOpenAviso(true);
      } else if (error.code === "ERR_NETWORK") {
        showError(
          "Servidor indisponível. Verifique se o backend está rodando em /api/auth/login",
        );
      } else {
        setMensagemAviso(
          error.response?.data?.message || "Erro ao fazer login. Tente novamente.",
        );
        setOpenAviso(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authService.isAuthenticated()) {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          p: 4,
        }}
      >
        <LoginIcon sx={{ fontSize: 120, mb: 3, opacity: 0.9 }} />
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
          CRM VEXA
        </Typography>
        <Typography
          variant="h6"
          sx={{ opacity: 0.9, textAlign: "center", maxWidth: 500 }}
        >
          Sistema de Gerenciamento de Relacionamento com Cliente
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "background.paper",
          p: 4,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 1, color: "primary.main" }}
            >
              CRM VEXA
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Entre com suas credenciais
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              required
              disabled={loading}
              placeholder="seu@email.com"
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 4 }}
              required
              disabled={loading}
              placeholder="••••••••"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "uppercase",
                bgcolor: "#2563EB",
                "&:hover": { bgcolor: "#1D4ED8" },
                boxShadow: "0 3px 5px 2px rgba(37, 99, 235, .3)",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Esqueceu sua senha?{" "}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: mode === "dark" ? "#60A5FA" : "#2563EB",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Recuperar
              </a>
            </Typography>
          </Box>

          {DEMO_SEM_BACKEND && (
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                display="block"
              >
                Modo demo (backend desativado)
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      <Dialog
        open={openAviso}
        onClose={() => setOpenAviso(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 320 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "warning.main",
            fontWeight: 600,
          }}
        >
          <WarningAmber />
          Aviso
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            {mensagemAviso}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenAviso(false)}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;
