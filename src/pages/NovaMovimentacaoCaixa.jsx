import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  InputAdornment,
} from "@mui/material";
import { ArrowBack, AttachMoney, TrendingDown, TrendingUp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import { caixaService } from "../api/caixaService";
import { vexaColors } from "../theme";
import { showSuccess, showError } from "../utils/notifications";
import { useInAppNotifications } from "../contexts/InAppNotificationContext";
import AppDatePicker from "../components/AppDatePicker";

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

/** Bordas/labels alinhados ao MuiTextField do tema (Selects não herdam TextField). */
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
        borderColor: isDark ? alpha(vexaColors.amareloNeon, 0.75) : vexaColors.amareloNeon,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
    "& .MuiSelect-select": { py: 1.25, fontSize: "0.875rem" },
  };
}

function NovaMovimentacaoCaixa() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { registrarMovimentacaoManualCriada } = useInAppNotifications();
  const fieldSx = outlineFieldSx(theme);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    tipo: "lucro",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    categoria: "",
    observacoes: "",
    formaPagamento: "",
  });

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
    e.preventDefault();
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
      navigate("/caixa");
    } catch (err) {
      showError(apiMessage(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        color: theme.palette.text.primary,
      }}
    >
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 4,
          py: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/caixa")}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Voltar
          </Button>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Nova movimentação
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Registre um lucro (entrada) ou uma despesa (saída) no caixa.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={2.5}>
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
              <AppDatePicker
                required
                label="Data"
                value={form.data}
                onChange={(v) => handleChange({ target: { name: "data", value: v } })}
                sx={fieldSx}
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
            <Grid size={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Button
                  type="button"
                  onClick={() => navigate("/caixa")}
                  sx={{ textTransform: "none" }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={salvando}
                  startIcon={<AttachMoney />}
                  sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
                >
                  {salvando ? "Salvando…" : "Salvar movimentação"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

export default NovaMovimentacaoCaixa;
