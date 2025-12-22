// src/pages/Usuarios.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  Paper,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Add, Edit, Delete, Search, Person } from "@mui/icons-material";
import api from "../api/axiosConfig";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ CORREÇÃO: Mover para dentro do useEffect
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get("/usuarios");
        const usuariosArray = Array.isArray(response.data) ? response.data : [];
        setUsuarios(usuariosArray);
        setUsuariosFiltrados(usuariosArray);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        setUsuarios([]);
        setUsuariosFiltrados([]);
      }
    };

    fetchUsuarios();
  }, []); // ✅ Array vazio = executa apenas uma vez

  const handleSearch = (e) => {
    const termo = e.target.value.toLowerCase();
    setSearchTerm(termo);

    if (termo === "") {
      setUsuariosFiltrados(usuarios);
    } else {
      const filtrados = usuarios.filter(
        (usuario) =>
          usuario.nome?.toLowerCase().includes(termo) ||
          usuario.email?.toLowerCase().includes(termo) ||
          usuario.perfil?.toLowerCase().includes(termo)
      );
      setUsuariosFiltrados(filtrados);
    }
  };

  const getInitials = (nome) => {
    if (!nome) return "?";
    const parts = nome.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (nome) => {
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#14b8a6",
    ];
    const index = nome?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
            Usuários
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              borderRadius: "8px",
              px: 3,
              py: 1,
              boxShadow: "none",
            }}
          >
            Novo Usuário
          </Button>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Buscar por nome, email ou perfil..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            borderRadius: "10px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": { border: "1px solid #e5e7eb" },
              "&:hover fieldset": { border: "1px solid #d1d5db" },
              "&.Mui-focused fieldset": { border: "1px solid #2563eb" },
            },
          }}
        />

        {/* Contador */}
        <Typography
          variant="body2"
          sx={{ mt: 2, color: "#6b7280", fontSize: "14px" }}
        >
          {usuariosFiltrados.length}{" "}
          {usuariosFiltrados.length === 1 ? "usuário" : "usuários"}
        </Typography>
      </Box>

      {/* Tabela */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f9fafb" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "13px",
                  py: 2,
                }}
              >
                USUÁRIO
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                PERFIL
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                STATUS
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                AÇÕES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(usuariosFiltrados) &&
            usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((usuario, index) => (
                <TableRow
                  key={usuario.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9fafb" },
                    borderBottom:
                      index === usuariosFiltrados.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(usuario.nome),
                          width: 40,
                          height: 40,
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {getInitials(usuario.nome)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {usuario.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {usuario.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.perfil || "Sem perfil"}
                      size="small"
                      sx={{
                        bgcolor: "#f3f4f6",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={usuario.ativo ? "Ativo" : "Inativo"}
                      size="small"
                      sx={{
                        bgcolor: usuario.ativo ? "#dcfce7" : "#f3f4f6",
                        color: usuario.ativo ? "#16a34a" : "#6b7280",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 8, color: "#9ca3af" }}
                >
                  <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">
                    Nenhum usuário encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Novo Usuário" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Usuarios;
