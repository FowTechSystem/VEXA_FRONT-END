// src/pages/Login.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { authPillTextFieldSx } from "../components/Auth/authFieldStyles";
import {
  Visibility,
  VisibilityOff,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { showError } from "../utils/notifications";
import { authService } from "../api/authService";
import AuthSplitShell from "../components/Auth/AuthSplitShell";

const DEMO_SEM_BACKEND = false;

const MSG_CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos. Verifique e tente novamente.";

function Login() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openAviso, setOpenAviso] = useState(false);
  const [mensagemAviso, setMensagemAviso] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

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
          "Servidor indisponível. Confirme se a API responde em /api/Auth/login no mesmo domínio (HTTPS) e se o proxy Nginx encaminha /api.",
        );
      } else {
        setMensagemAviso(
          error.response?.data?.message ||
            error.response?.data?.Message ||
            "Erro ao fazer login. Tente novamente.",
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
    <>
      <AuthSplitShell title="Acessar conta" subtitle="Entre com o e-mail e a senha da sua conta.">
        <form onSubmit={handleLogin} noValidate>
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2.5, ...authPillTextFieldSx(theme, isLight) }}
            disabled={loading}
            placeholder="seu@email.com"
            inputProps={{ "aria-required": "true", autoComplete: "email" }}
          />

          <TextField
            fullWidth
            label="Senha"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3.5, ...authPillTextFieldSx(theme, isLight) }}
            disabled={loading}
            placeholder="••••••••"
            inputProps={{ "aria-required": "true", autoComplete: "current-password" }}
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
            color="primary"
            type="submit"
            size="large"
            disabled={loading}
            sx={{
              py: 1.35,
              fontSize: "1rem",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 999,
              boxShadow: isLight
                ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                : `0 4px 18px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

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
      </AuthSplitShell>

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
    </>
  );
}

export default Login;
