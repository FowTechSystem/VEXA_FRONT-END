// src/components/UserProfileDrawer.jsx
import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  Divider,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Alert,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { authService } from "../api/authService";

function UserProfileDrawer({ open, onClose }) {
  const user = authService.getUsuario();
  const empresaNome = user.empresaNome || (user.empresaId != null ? `Empresa #${user.empresaId}` : "Empresa");
  const userData = {
    nome: user.nome || "—",
    email: user.email || "—",
    perfil: user.perfil || "—",
    empresaNome,
    funcao: (user.perfil || "").toLowerCase(),
  };

  // Estados para formulários
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaDesenvolvedor, setSenhaDesenvolvedor] = useState("");
  const [showTrocarSenha, setShowTrocarSenha] = useState(false);
  const [showAddFuncionario, setShowAddFuncionario] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dados do novo funcionário
  const [novoFuncionario, setNovoFuncionario] = useState({
    nome: "",
    idade: "",
    funcao: "vendedor",
    email: "",
    senha: "",
  });

  const handleTrocarSenha = () => {
    setError("");
    setSuccess("");

    // Senha de desenvolvedor: dev123
    if (senhaDesenvolvedor === "dev123") {
      // Desenvolvedor pode trocar sem senha antiga
      if (!novaSenha) {
        setError("Digite a nova senha");
        return;
      }
      setSuccess("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setSenhaDesenvolvedor("");
      setTimeout(() => setShowTrocarSenha(false), 2000);
    } else {
      // Usuário normal precisa da senha antiga
      if (!senhaAtual || !novaSenha) {
        setError("Preencha todos os campos");
        return;
      }
      // Aqui você chamaria a API para validar a senha antiga
      setSuccess("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setSenhaDesenvolvedor("");
      setTimeout(() => setShowTrocarSenha(false), 2000);
    }
  };

  const handleAddFuncionario = () => {
    setError("");
    setSuccess("");

    if (
      !novoFuncionario.nome ||
      !novoFuncionario.email ||
      !novoFuncionario.senha
    ) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    // Aqui você chamaria a API para criar o funcionário
    console.log("Novo funcionário:", novoFuncionario);
    setSuccess("Funcionário cadastrado com sucesso!");
    setNovoFuncionario({
      nome: "",
      idade: "",
      funcao: "vendedor",
      email: "",
      senha: "",
    });
    setTimeout(() => setShowAddFuncionario(false), 2000);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 400,
          padding: 3,
        },
      }}
    >
      <Box>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
            Meu Perfil
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Avatar e Nome da Empresa (identidade principal) */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              margin: "0 auto",
              mb: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontSize: 40,
            }}
          >
            {userData.empresaNome.charAt(0)}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {userData.empresaNome}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Empresa
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Usuário logado */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Usuário logado
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Nome:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userData.nome}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              E-mail:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userData.email}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Perfil:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userData.perfil}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Botão Trocar Senha */}
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setShowTrocarSenha(!showTrocarSenha)}
          sx={{ mb: 2 }}
        >
          {showTrocarSenha ? "Cancelar" : "Trocar Senha"}
        </Button>

        {/* Formulário Trocar Senha */}
        {showTrocarSenha && (
          <Box sx={{ mb: 3, p: 2, border: "1px solid",
            borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Alterar Senha
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Senha Atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />

            <TextField
              fullWidth
              label="Nova Senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
              required
            />

            <TextField
              fullWidth
              label="Senha de Desenvolvedor (Opcional)"
              type="password"
              value={senhaDesenvolvedor}
              onChange={(e) => setSenhaDesenvolvedor(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
              helperText="Desenvolvedor pode usar: dev123"
            />

            <Button fullWidth variant="contained" onClick={handleTrocarSenha}>
              Confirmar
            </Button>
          </Box>
        )}

        {/* Seção GERENTE - Adicionar Funcionário */}
        {userData.funcao === "gerente" && (
          <>
            <Divider sx={{ mb: 3 }} />

            <Button
              fullWidth
              variant="contained"
              onClick={() => setShowAddFuncionario(!showAddFuncionario)}
              sx={{ mb: 2 }}
            >
              {showAddFuncionario ? "Cancelar" : "Adicionar Funcionário"}
            </Button>

            {/* Formulário Adicionar Funcionário */}
            {showAddFuncionario && (
              <Box sx={{ p: 2, border: "1px solid",
            borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Novo Funcionário
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={novoFuncionario.nome}
                  onChange={(e) =>
                    setNovoFuncionario({
                      ...novoFuncionario,
                      nome: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                  size="small"
                  required
                />

                <TextField
                  fullWidth
                  label="Idade"
                  type="number"
                  value={novoFuncionario.idade}
                  onChange={(e) =>
                    setNovoFuncionario({
                      ...novoFuncionario,
                      idade: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                  size="small"
                />

                <TextField
                  fullWidth
                  select
                  label="Função"
                  value={novoFuncionario.funcao}
                  onChange={(e) =>
                    setNovoFuncionario({
                      ...novoFuncionario,
                      funcao: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                  size="small"
                >
                  <MenuItem value="vendedor">Vendedor</MenuItem>
                  <MenuItem value="caixa">Caixa</MenuItem>
                  <MenuItem value="estoquista">Estoquista</MenuItem>
                  <MenuItem value="gerente">Gerente</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  value={novoFuncionario.email}
                  onChange={(e) =>
                    setNovoFuncionario({
                      ...novoFuncionario,
                      email: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                  size="small"
                  required
                />

                <TextField
                  fullWidth
                  label="Senha Inicial"
                  type="password"
                  value={novoFuncionario.senha}
                  onChange={(e) =>
                    setNovoFuncionario({
                      ...novoFuncionario,
                      senha: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                  size="small"
                  required
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddFuncionario}
                >
                  Cadastrar Funcionário
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
}

export default UserProfileDrawer;
