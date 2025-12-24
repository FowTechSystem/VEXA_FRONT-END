// src/pages/Vendas.jsx (SUBSTITUIR O EXISTENTE)
import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Alert,
  IconButton,
  Fade,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import { useVendas } from "../hooks/useVendas";
import { VendasTable } from "../components/Vendas/VendasTable";
import { NovaVendaDialog } from "../components/Vendas/NovaVendaDialog";

function Vendas() {
  const {
    vendas,
    clientes,
    produtos,
    loading,
    error,
    createVenda,
    refetch,
    clearError,
  } = useVendas();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewDetails = (venda) => {
    console.log("Ver detalhes da venda:", venda);
    // TODO: Implementar modal de detalhes
  };

  const handleEdit = (venda) => {
    console.log("Editar venda:", venda);
    // TODO: Implementar edição
  };

  const handleDelete = (venda) => {
    console.log("Excluir venda:", venda);
    // TODO: Implementar exclusão com confirmação
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{ color: "text.primary" }}
          >
            Vendas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todas as vendas do seu negócio
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton
            onClick={refetch}
            disabled={loading}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              textTransform: "none",
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            Nova Venda
          </Button>
        </Box>
      </Box>

      {error && (
        <Fade in={!!error}>
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={clearError}
          >
            {error}
          </Alert>
        </Fade>
      )}

      <Box display="flex" gap={2} mb={3}>
        <Card
          sx={{
            flex: 1,
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total de Vendas
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {vendas.length}
          </Typography>
        </Card>
        <Card
          sx={{
            flex: 1,
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Valor Total
          </Typography>
          <Typography variant="h5" fontWeight={700} color="primary">
            R${" "}
            {vendas
              .reduce((acc, v) => acc + parseFloat(v.valorTotal || 0), 0)
              .toFixed(2)}
          </Typography>
        </Card>
      </Box>

      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <VendasTable
          vendas={vendas}
          loading={loading}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <NovaVendaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clientes={clientes}
        produtos={produtos}
        onSave={createVenda}
      />
    </Box>
  );
}

export default Vendas;
