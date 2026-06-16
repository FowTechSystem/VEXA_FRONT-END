// src/components/Bazar/RepasseDetalheDialog.jsx
// Modal de detalhes de um repasse — carrega o detalhe (com peças) via API e
// permite marcar como pago ou cancelar (somente repasses pendentes).
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Close, CheckCircle, DeleteOutline } from "@mui/icons-material";
import { LoadingBox } from "../LoadingBox";
import ConfirmDialog from "../ConfirmDialog";
import { bazarRepassesService } from "../../api/bazarRepassesService";
import { STATUS_REPASSE } from "./bazarConstants";
import {
  formatBRL,
  formatData,
  getAvatarColor,
  getInitials,
} from "./bazarHelpers";
import { showSuccess, showError } from "../../utils/notifications";

function RepasseDetalheDialog({ open, repasseId, onClose, onChanged }) {
  const theme = useTheme();
  const [repasse, setRepasse] = useState(null);
  const [carregando, setCarregando] = useState(false);
  // "pagar" | "cancelar" | null — confirmação pendente
  const [confirmacao, setConfirmacao] = useState(null);
  const [executando, setExecutando] = useState(false);

  useEffect(() => {
    if (!open || !repasseId) {
      setRepasse(null);
      setConfirmacao(null);
      return undefined;
    }
    let cancelled = false;
    setCarregando(true);
    bazarRepassesService
      .getById(repasseId)
      .then((data) => {
        if (!cancelled) setRepasse(data);
      })
      .catch((error) => {
        console.error("[RepasseDetalheDialog] erro ao carregar:", error);
        if (!cancelled) {
          showError("Não foi possível carregar os detalhes do repasse.");
          onClose?.();
        }
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, repasseId]);

  const isPago = repasse?.status === STATUS_REPASSE.PAGO;
  const pecas = repasse?.pecas || [];

  const executar = async () => {
    if (!repasse || executando) return;
    setExecutando(true);
    try {
      if (confirmacao === "pagar") {
        await bazarRepassesService.marcarComoPago(repasse.id);
        showSuccess("Repasse marcado como pago.");
      } else if (confirmacao === "cancelar") {
        await bazarRepassesService.cancelar(repasse.id);
        showSuccess(
          "Repasse cancelado. As peças voltaram para a lista de pendentes.",
        );
      }
      setConfirmacao(null);
      onChanged?.();
      onClose?.();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Não foi possível concluir a operação.";
      showError(msg);
      console.error("[RepasseDetalheDialog] erro:", error);
    } finally {
      setExecutando(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
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
          sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: getAvatarColor(repasse?.consignante?.nome || ""),
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {getInitials(repasse?.consignante?.nome || "?")}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Repasse #{repasseId}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {repasse?.consignante?.nome || ""}
            </Typography>
          </Box>
          {repasse && (
            <Chip
              label={isPago ? "Pago" : "Pendente"}
              size="small"
              sx={
                isPago
                  ? {
                      bgcolor: alpha(theme.palette.success.main, 0.18),
                      color: theme.palette.success.main,
                      fontWeight: 700,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
                    }
                  : {
                      bgcolor: alpha(theme.palette.warning.main, 0.18),
                      color: theme.palette.warning.main,
                      fontWeight: 700,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                    }
              }
            />
          )}
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {carregando || !repasse ? (
            <LoadingBox size={36} py={6} />
          ) : (
            <>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
                <InfoItem titulo="Data" valor={formatData(repasse.data)} />
                <InfoItem
                  titulo="Forma de pagamento"
                  valor={repasse.formaPagamento || "—"}
                />
                <InfoItem titulo="Valor total" valor={formatBRL(repasse.valor)} />
              </Box>

              {repasse.observacao && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic", mb: 2 }}
                >
                  “{repasse.observacao}”
                </Typography>
              )}

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={cellHead}>PEÇA</TableCell>
                      <TableCell sx={cellHead}>VENDIDA EM</TableCell>
                      <TableCell sx={cellHead} align="right">
                        VALOR
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pecas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          align="center"
                          sx={{ py: 3, color: "text.secondary" }}
                        >
                          Sem peças associadas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pecas.map((p) => (
                        <TableRow key={p.id}>
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {repasse && !isPago && (
            <>
              <Button
                color="error"
                startIcon={<DeleteOutline />}
                onClick={() => setConfirmacao("cancelar")}
                disabled={executando}
                sx={{ textTransform: "none", fontWeight: 600, mr: "auto" }}
              >
                Cancelar repasse
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => setConfirmacao("pagar")}
                disabled={executando}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Marcar como pago
              </Button>
            </>
          )}
          <Button
            onClick={onClose}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmacao === "pagar"}
        onClose={() => (executando ? null : setConfirmacao(null))}
        onConfirm={executar}
        variant="confirm"
        loading={executando}
        title="Marcar repasse como pago"
        message={
          repasse
            ? `Confirmar o pagamento de ${formatBRL(repasse.valor)} para ${repasse.consignante?.nome}? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Confirmar pagamento"
      />

      <ConfirmDialog
        open={confirmacao === "cancelar"}
        onClose={() => (executando ? null : setConfirmacao(null))}
        onConfirm={executar}
        variant="warning"
        destructive
        loading={executando}
        title="Cancelar repasse"
        message={
          repasse
            ? `Cancelar o repasse de ${formatBRL(repasse.valor)} para ${repasse.consignante?.nome}? As peças voltarão para a lista de pendentes.`
            : ""
        }
        confirmLabel="Cancelar repasse"
      />
    </>
  );
}

function InfoItem({ titulo, valor }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {titulo}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{valor}</Typography>
    </Box>
  );
}

const cellHead = {
  fontWeight: 700,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "text.secondary",
};

export default RepasseDetalheDialog;
