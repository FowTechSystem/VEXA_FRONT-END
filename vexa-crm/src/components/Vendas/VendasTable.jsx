// src/components/Vendas/VendasTable.jsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Visibility, Edit, Delete } from "@mui/icons-material";

const STATUS_CONFIG = {
  Concluída: { color: "success", label: "Concluída" },
  Pendente: { color: "warning", label: "Pendente" },
  Cancelada: { color: "error", label: "Cancelada" },
};

const VendasTableRow = ({ venda, onViewDetails, onEdit, onDelete }) => {
  const statusConfig = STATUS_CONFIG[venda.status] || STATUS_CONFIG.Concluída;

  return (
    <TableRow
      hover
      sx={{
        "&:hover": {
          bgcolor: "action.hover",
          transition: "background-color 0.2s ease",
        },
      }}
    >
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="primary">
          #{venda.id}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{venda.nomeCliente}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600} color="primary.main">
          R$ {parseFloat(venda.valorTotal).toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip
          label={statusConfig.label}
          size="small"
          color={statusConfig.color}
          sx={{
            fontWeight: 500,
            minWidth: 90,
            fontSize: "0.75rem",
          }}
        />
      </TableCell>
      <TableCell align="right">
        <Box display="flex" gap={0.5} justifyContent="flex-end">
          <Tooltip title="Ver detalhes">
            <IconButton
              size="small"
              onClick={() => onViewDetails(venda)}
              sx={{ color: "primary.main" }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {onEdit && (
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => onEdit(venda)}
                sx={{ color: "info.main" }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Excluir">
              <IconButton
                size="small"
                onClick={() => onDelete(venda)}
                sx={{ color: "error.main" }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          Nenhuma venda cadastrada
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Clique em "Nova Venda" para começar
        </Typography>
      </Box>
    </TableCell>
  </TableRow>
);

const LoadingState = () => (
  <TableRow>
    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
      <CircularProgress size={40} />
    </TableCell>
  </TableRow>
);

export const VendasTable = ({
  vendas,
  loading,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  return (
    <TableContainer
      sx={{
        maxHeight: "70vh",
        overflow: "auto",
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2 }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
              Cliente
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
              Data
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Valor Total
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Status
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Ações
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <LoadingState />
          ) : vendas.length > 0 ? (
            vendas.map((venda) => (
              <VendasTableRow
                key={venda.id}
                venda={venda}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
