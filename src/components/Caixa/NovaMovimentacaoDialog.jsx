// src/components/Caixa/NovaMovimentacaoDialog.jsx
// Dialog para registrar nova movimentação manual no caixa (lucro ou despesa).
// Abre como modal sobre a tela Caixa, sem precisar navegar para outra rota.
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  AttachMoney,
  TrendingDown,
  TrendingUp,
  Close,
} from "@mui/icons-material";
import { caixaService } from "../../api/caixaService";
import { vexaColors } from "../../theme";
import { showSuccess, showError } from "../../utils/notifications";
import { useInAppNotifications } from "../../contexts/InAppNotificationContext";
import VexaDatePicker from "../VexaDatePicker";

const CATEGORIAS_LUCRO = [
  "Vendas",
  "Prestação de Serviços",
  "Recebimento de Cliente",
  "Outras Receitas",
];

const CATEGORIAS_DESPESA = [
  "Fornecedores",
  "Salários",
  "Aluguel",
  "Energia",
  "Internet",
  "Marketing",
  "Impostos",
  "Outras Despesas",
];

const FORMAS_OPCIONAIS = [
  { value: "", label: "Não informar" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
  { value: "pix", label: "PIX" },
];

function apiMessage(err) {
  const d = err?.response?.data;
  if (d && typeof d === "object" && d.message != null) return String(d.message);
  if (typeof d === "string" && d.trim()) return d;
  return err?.message || "Não foi possível salvar.";
}

function outlineFieldSx(theme) {
  const isDark = theme.palette.mode === "dark";
  return {
    width: "100%",
    minWidth: 0,
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: isDark
          ? alpha(vexaColors.cinzaAzulado, 0.35)
          : alpha(vexaColors.azulEscuro, 0.22),
      },
      "&:hover fieldset": {
        borderColor: isDark
          ? alpha(vexaColors.cinzaAzulado, 0.55)
          : alpha(vexaColors.azulEscuro, 0.35),
      },
      "&.Mui-focused fieldset": {
        borderColor: isDark
          ? alpha(theme.palette.primary.main, 0.75)
          : theme.palette.primary.main,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
    "& .MuiSelect-select": { py: 1.25, fontSize: "0.875rem" },
  };
}

const ESTADO_INICIAL = () => ({
  tipo: "lucro",
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
  categoria: "",
  observacoes: "",
  formaPagamento: "",
});

function NovaMovimentacaoDialog({ open, onClose, onSaved }) {
  const theme = useTheme();
  const { registrarMovimentacaoManualCriada } = useInAppNotifications();
  const fieldSx = outlineFieldSx(theme);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(ESTADO_INICIAL);

  // Reseta o form sempre que abrir
  useEffect(() => {
    if (open) setForm(ESTADO_INICIAL());
  }, [open]);

  const categorias = form.tipo === "lucro" ? CATEGORIAS_LUCRO : CATEGORIAS_DESPESA;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "tipo") {
        next.categoria = "";
        if (value === "despesa") next.formaPagamento = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const faltando = [];
    if (!form.descricao?.trim()) faltando.push("Descrição");
    if (!form.valor || Number(form.valor) <= 0) faltando.push("Valor válido");
    if (!form.data?.trim()) faltando.push("Data");
    if (!form.categoria?.trim()) faltando.push("Categoria");
    if (faltando.length) {
      showError(`Preencha: ${faltando.join(", ")}.`);
      return;
    }

    const payload = {
      tipo: form.tipo === "lucro" ? "entrada_lucro" : "saida_despesa",
      valor: Number(form.valor),
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      data: form.data,
      observacoes: form.observacoes?.trim() || undefined,
    };
    if (form.tipo === "lucro" && form.formaPagamento) {
      payload.formaPagamento = form.formaPagamento;
    }

    setSalvando(true);
    try {
      const res = await caixaService.criarMovimentacaoManual(payload);
      registrarMovimentacaoManualCriada({
        idBackend: res?.id ?? res?.Id,
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        entrada: form.tipo === "lucro",
      });
      showSuccess("Movimentação registrada.");
      onSaved?.();
      onClose?.();
    } catch (err) {
      showError(apiMessage(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={salvando ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          py: 1.5,
          px: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AttachMoney sx={{ color: "primary.main", fontSize: 24 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>
              Nova movimentação
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Registre um lucro (entrada) ou uma despesa (saída) no caixa
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={salvando} aria-label="Fechar">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormControl fullWidth size="small" required sx={fieldSx}>
              <InputLabel id="tipo-mov-label">Tipo</InputLabel>
              <Select
                labelId="tipo-mov-label"
                name="tipo"
                value={form.tipo}
                label="Tipo"
                onChange={handleChange}
              >
                <MenuItem value="lucro">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUp fontSize="small" color="success" />
                    Lucro (entrada)
                  </Box>
                </MenuItem>
                <MenuItem value="despesa">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingDown fontSize="small" color="error" />
                    Despesa (saída)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              required
              size="small"
              label="Descrição"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Ex.: Ajuste de caixa, pagamento de aluguel"
              sx={fieldSx}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Valor"
              name="valor"
              type="number"
              value={form.valor}
              onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              inputProps={{ step: "0.01", min: "0.01" }}
              sx={fieldSx}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>

            <VexaDatePicker
              label="Data"
              value={form.data}
              onChange={(v) =>
                handleChange({ target: { name: "data", value: v } })
              }
              fullWidth
              minWidth={0}
              slotProps={{ textField: { required: true, sx: fieldSx } }}

            />
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth size="small" required sx={fieldSx}>
              <InputLabel id="cat-mov-label">Categoria</InputLabel>
              <Select
                labelId="cat-mov-label"
                name="categoria"
                value={form.categoria}
                label="Categoria"
                onChange={handleChange}
              >
                {categorias.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {form.tipo === "lucro" && (
            <Grid size={12}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel id="fp-mov-label">Forma de pagamento (opcional)</InputLabel>
                <Select
                  labelId="fp-mov-label"
                  name="formaPagamento"
                  value={form.formaPagamento}
                  label="Forma de pagamento (opcional)"
                  onChange={handleChange}
                >
                  {FORMAS_OPCIONAIS.map((f) => (
                    <MenuItem key={f.value || "none"} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid size={12}>
            <TextField
              fullWidth
              size="small"
              label="Observações"
              name="observacoes"
              multiline
              rows={3}
              value={form.observacoes}
              onChange={handleChange}
              placeholder="Informações adicionais"
              sx={fieldSx}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          gap: 1,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          type="button"
          onClick={onClose}
          disabled={salvando}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={salvando}
          startIcon={<AttachMoney />}
          sx={{ textTransform: "none", fontWeight: 700, px: 2.5 }}
        >
          {salvando ? "Salvando…" : "Salvar movimentação"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NovaMovimentacaoDialog;
