// src/pages/Login.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Container,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (email && password) {
      // ANTES (localStorage)
      localStorage.setItem("isAuthenticated", "true");

      // DEPOIS (sessionStorage - apaga ao fechar navegador)
      sessionStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", email);
      navigate("/");
    } else {
      alert("Por favor, preencha todos os campos");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh", // ALTURA FIXA EM 100vh
        width: "100vw", // LARGURA FIXA EM 100vw
        overflow: "hidden", // EVITA SCROLL
      }}
    >
      {/* Lado Esquerdo - Azul com gradiente */}
      <Box
        sx={{
          flex: 1,
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
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

      {/* Lado Direito - Formulário */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#fff",
          p: 4,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 1, color: "#1976d2" }}
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
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "uppercase",
                background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                boxShadow: "0 3px 5px 2px rgba(25, 118, 210, .3)",
              }}
            >
              Entrar
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Esqueceu sua senha?{" "}
              <a
                href="#"
                style={{
                  color: "#1976d2",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Recuperar
              </a>
            </Typography>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #eee" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              display="block"
            >
              Para testar, use qualquer e-mail e senha
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Login;
