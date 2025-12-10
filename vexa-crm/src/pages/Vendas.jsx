// src/pages/Vendas.jsx
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Autocomplete,
} from "@mui/material";
import { Add, Visibility } from "@mui/icons-material";
import { vendasService } from "../api/vendasService";
import { clientesService } from "../api/clientesService";
import { produtosService } from "../api/produtosService";

function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentVenda, setCurrentVenda] = useState({
    clienteId: null,
    produtoId: null,
    quantidade: 1,
    valorTotal: 0,
    dataVenda: new Date().toISOString().split("T")[0],
  });

  // MOVA TODAS AS FUNÇÕES PARA ANTES DO useEffect
  const fetchVendas = async () => {
    try {
      const data = await vendasService.getAll();
      setVendas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      setVendas([]);
    }
  };

  const fetchClientes = async () => {
    try {
      const data = await clientesService.getAll();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setClientes([]);
    }
  };

  const fetchProdutos = async () => {
    try {
      const data = await produtosService.getAll();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProdutos([]);
    }
  };

  useEffect(() => {
    fetchVendas();
    fetchClientes();
    fetchProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = () => {
    setCurrentVenda({
      clienteId: null,
      produtoId: null,
      quantidade: 1,
      valorTotal: 0,
      dataVenda: new Date().toISOString().split("T")[0],
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      await vendasService.create(currentVenda);
      fetchVendas();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
    }
  };

  const handleChange = (field, value) => {
    setCurrentVenda({
      ...currentVenda,
      [field]: value,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Concluída":
        return "success";
      case "Pendente":
        return "warning";
      case "Cancelada":
        return "error";
      default:
        return "default";
    }
  };

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
          Vendas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Nova Venda
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Data</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Valor Total</strong>
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
                {Array.isArray(vendas) && vendas.length > 0 ? (
                  vendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>#{venda.id}</TableCell>
                      <TableCell>{venda.nomeCliente}</TableCell>
                      <TableCell>
                        {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600 }}>
                          R$ {parseFloat(venda.valorTotal).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={venda.status || "Concluída"}
                          size="small"
                          color={getStatusColor(venda.status || "Concluída")}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          variant="outlined"
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhuma venda cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nova Venda</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(option) =>
                  option.nomeCompleto || option.nome || ""
                }
                onChange={(e, value) => handleChange("clienteId", value?.id)}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Autocomplete
                options={produtos}
                getOptionLabel={(option) => option.nome || ""}
                onChange={(e, value) => handleChange("produtoId", value?.id)}
                renderInput={(params) => (
                  <TextField {...params} label="Produto" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantidade"
                type="number"
                value={currentVenda.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor Total"
                type="number"
                value={currentVenda.valorTotal}
                onChange={(e) => handleChange("valorTotal", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data da Venda"
                type="date"
                value={currentVenda.dataVenda}
                onChange={(e) => handleChange("dataVenda", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Vendas;
