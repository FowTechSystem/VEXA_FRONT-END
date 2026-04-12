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
  Link as MuiLink,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { showError } from "../utils/notifications";
import { authService } from "../api/authService";
import AuthSplitShell from "../components/Auth/AuthSplitShell";

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
      <AuthSplitShell title="VEXA" subtitle="Entre com suas credenciais">
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
            color="primary"
            type="submit"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "uppercase",
              boxShadow: "0 3px 5px 2px rgba(248, 243, 43, 0.35)",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Esqueceu sua senha?{" "}
            <MuiLink
              component={Link}
              to="/recuperar-senha"
              sx={{
                color: "#F8F32B",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Recuperar
            </MuiLink>
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
