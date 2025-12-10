// src/pages/Usuarios.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../api/axiosConfig";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  // MOVA A FUNÇÃO PARA ANTES DO useEffect
  const fetchUsuarios = async () => {
    try {
      const response = await api.get("/usuarios");
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setUsuarios([]);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Usuários
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Novo Usuário
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Usuário</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Perfil</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(usuarios) && usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar>{usuario.nome.charAt(0)}</Avatar>
                          <Typography>{usuario.nome}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.perfil}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={usuario.ativo ? "Ativo" : "Inativo"}
                          size="small"
                          color={usuario.ativo ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum usuário cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Usuarios;
