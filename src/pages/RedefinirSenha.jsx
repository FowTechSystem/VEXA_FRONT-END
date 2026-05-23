import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import AuthSplitShell from "../components/Auth/AuthSplitShell";
import { authService } from "../api/authService";
import { showError, showSuccess } from "../utils/notifications";

const MIN_SENHA = 6;

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (!token) {
    return (
      <AuthSplitShell
        title="Link inválido"
        subtitle="Abra o link enviado por e-mail ou solicite uma nova recuperação de senha."
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          O endereço precisa incluir o parâmetro <strong>token</strong> com o código de recuperação.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          component={Link}
          to="/recuperar-senha"
          sx={{
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "0 3px 5px 2px rgba(248, 243, 43, 0.35)",
          }}
        >
          Solicitar novo link
        </Button>
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <MuiLink
            component={Link}
            to="/login"
            underline="hover"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Voltar ao login
          </MuiLink>
        </Box>
      </AuthSplitShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senha.length < MIN_SENHA) {
      showError(`A senha deve ter pelo menos ${MIN_SENHA} caracteres.`);
      return;
    }
    if (senha !== senha2) {
      showError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await authService.redefinirSenhaComToken(token, senha);
      setOk(true);
      showSuccess("Senha alterada. Você já pode entrar com a nova senha.");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.Message ||
        (err.response?.status === 400
          ? "Link inválido ou expirado. Solicite um novo e-mail de recuperação."
          : null) ||
        (err.code === "ERR_NETWORK"
          ? "Servidor indisponível. Tente novamente."
          : "Não foi possível redefinir a senha.");
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <AuthSplitShell
        title="Senha atualizada"
        subtitle="Sua senha foi redefinida com sucesso."
      >
        <Button
          fullWidth
          variant="contained"
          color="primary"
          component={Link}
          to="/login"
          size="large"
          sx={{
            py: 1.5,
            fontWeight: 600,
            textTransform: "uppercase",
            boxShadow: "0 3px 5px 2px rgba(248, 243, 43, 0.35)",
          }}
        >
          Ir para o login
        </Button>
      </AuthSplitShell>
    );
  }

  return (
    <AuthSplitShell
      title="Nova senha"
      subtitle="Defina uma nova senha para sua conta (mínimo 6 caracteres)."
    >
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Nova senha"
          type={show1 ? "text" : "password"}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          sx={{ mb: 2 }}
          required
          disabled={loading}
          autoComplete="new-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShow1(!show1)} edge="end" aria-label="mostrar senha">
                  {show1 ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Confirmar nova senha"
          type={show2 ? "text" : "password"}
          value={senha2}
          onChange={(e) => setSenha2(e.target.value)}
          sx={{ mb: 3 }}
          required
          disabled={loading}
          autoComplete="new-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShow2(!show2)} edge="end" aria-label="mostrar senha">
                  {show2 ? <VisibilityOff /> : <Visibility />}
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
          {loading ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>

      <Box sx={{ textAlign: "center", mt: 3 }}>
        <MuiLink
          component={Link}
          to="/login"
          underline="hover"
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          Voltar ao login
        </MuiLink>
      </Box>
    </AuthSplitShell>
  );
}
