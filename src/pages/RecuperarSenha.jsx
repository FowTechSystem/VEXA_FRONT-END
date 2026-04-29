import React, { useState } from "react";
import { Box, TextField, Button, Typography, Link as MuiLink } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { Link, Navigate } from "react-router-dom";
import AuthSplitShell from "../components/Auth/AuthSplitShell";
import { authPillTextFieldSx } from "../components/Auth/authFieldStyles";
import { authService } from "../api/authService";
import { showError, showSuccess } from "../utils/notifications";

export default function RecuperarSenha() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email?.trim();
    if (!trimmed) {
      showError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      await authService.solicitarRecuperacaoSenha(trimmed);
      setEnviado(true);
      showSuccess(
        "Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
      );
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        showError(
          "Não foi possível conectar ao servidor. Verifique sua rede e tente novamente.",
        );
        return;
      }
      if (err.response?.status === 429) {
        showError("Muitas solicitações. Aguarde alguns minutos e tente novamente.");
        return;
      }
      // Não revelar se o e-mail existe (404/400) — mesma mensagem de sucesso
      setEnviado(true);
      showSuccess(
        "Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      title="Recuperar senha"
      subtitle={
        enviado
          ? "Verifique sua caixa de entrada e o spam."
          : "Informe o e-mail da sua conta. Enviaremos um link para redefinir a senha."
      }
    >
      {!enviado ? (
        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3, ...authPillTextFieldSx(theme, isLight) }}
            disabled={loading}
            placeholder="seu@email.com"
            autoComplete="email"
            inputProps={{ "aria-required": "true" }}
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
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </form>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          O link expira após algumas horas. Se não encontrar o e-mail, confira a pasta de spam
          ou solicite novamente.
        </Typography>
      )}

      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          <MuiLink
            component={Link}
            to="/login"
            underline="hover"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Voltar ao login
          </MuiLink>
        </Typography>
      </Box>
    </AuthSplitShell>
  );
}
