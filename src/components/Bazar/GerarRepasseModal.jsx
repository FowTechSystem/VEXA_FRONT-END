// src/components/Bazar/GerarRepasseModal.jsx
// Modal "Gerar repasse" — exibe as peças vendidas pendentes do consignante,
// permite (des)marcar quais entram no repasse, escolher forma de pagamento e observação.
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Checkbox,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Avatar,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Close, Payments } from "@mui/icons-material";
import { LoadingBox } from "../LoadingBox";
import {
  formatBRL,
  formatData,
  getAvatarColor,
  getInitials,
} from "./bazarHelpers";
import { FORMAS_PAGAMENTO_REPASSE } from "./bazarConstants";

function GerarRepasseModal({ open, onClose, consignante, pecasPendentes, onConfirmar, carregando = false }) {
  const theme = useTheme();
  const [selecionados, setSelecionados] = useState(new Set());
  const [forma, setForma] = useState("PIX");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setSelecionados(new Set((pecasPendentes || []).map((p) => p.id)));
      setForma("PIX");
      setObservacao("");
      setEnviando(false);
    }
  }, [open, pecasPendentes]);

  const toggle = (id) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = useMemo(
    () =>
      (pecasPendentes || [])
        .filter((p) => selecionados.has(p.id))
        .reduce((acc, p) => acc + (Number(p.valorCompra) || 0), 0),
    [selecionados, pecasPendentes],
  );

  const handleConfirmar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      await onConfirmar?.({
        consignanteId: consignante?.id,
        pecasIds: Array.from(selecionados),
        formaPagamento: forma,
        observacao,
        valor: total,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
          pr: 6,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: getAvatarColor(consignante?.nome || ""),
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {getInitials(consignante?.nome || "?")}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            Gerar repasse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {consignante?.nome}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          Peças vendidas sem repasse
        </Typography>

        <Box
          sx={{
            mt: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      pecasPendentes.length > 0 &&
                      selecionados.size === pecasPendentes.length
                    }
                    indeterminate={
                      selecionados.size > 0 &&
                      selecionados.size < pecasPendentes.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelecionados(new Set(pecasPendentes.map((p) => p.id)));
                      } else {
                        setSelecionados(new Set());
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={cellHead}>PEÇA</TableCell>
                <TableCell sx={cellHead}>VENDIDA EM</TableCell>
                <TableCell sx={cellHead} align="right">
                  REPASSE
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <LoadingBox size={36} py={4} />
                  </TableCell>
                </TableRow>
              ) : pecasPendentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Nenhuma peça pendente para este consignante.
                  </TableCell>
                </TableRow>
              ) : (
                pecasPendentes.map((p) => {
                  const checked = selecionados.has(p.id);
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        bgcolor: checked
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={checked}
                          onChange={() => toggle(p.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                          {p.descricao}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tam {p.tamanho || "—"} · {p.cor || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                        {formatData(p.dataVenda)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatBRL(p.valorCompra)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2.5, flexDirection: { xs: "column", sm: "row" } }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Forma de pagamento</InputLabel>
            <Select
              value={forma}
              label="Forma de pagamento"
              onChange={(e) => setForma(e.target.value)}
            >
              {FORMAS_PAGAMENTO_REPASSE.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Observação"
            size="small"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Anotação interna sobre este repasse (opcional)"
          />
        </Box>

        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.35),
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total do repasse
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>
              {formatBRL(total)}
            </Typography>
          </Box>
          <Payments sx={{ color: "primary.main", fontSize: 36 }} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={enviando}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmar}
          variant="contained"
          disabled={selecionados.size === 0 || enviando || carregando}
          sx={{ textTransform: "none", fontWeight: 700, px: 4 }}
        >
          {enviando ? "Enviando..." : "Confirmar repasse"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const cellHead = {
  fontWeight: 700,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "text.secondary",
};

export default GerarRepasseModal;
