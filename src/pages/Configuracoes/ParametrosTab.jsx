import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Alert,
  Paper,
  Grid,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { fetchSettingsMap, bulkUpdateSettings } from "../../api/settingsService";
import { showSuccess, showError } from "../../utils/notifications";
import { VEX, configUiPalette } from "./configuracoesHelpers";

const STORAGE_EMPRESA = "vexa_config";
const defaultEmpresa = {
  nomeEmpresa: "",
  cnpj: "",
  telefone: "",
  emailContato: "",
};

const GROUP_KEYS = {
  vendas: ["vendas_max_discount_pct", "vendas_cancel_minutes", "vendas_allow_below_cost"],
  pagamentos: ["pay_credit", "pay_debit", "pay_pix", "pay_cash", "pay_max_installments"],
  estoque: ["est_min_qty_alert", "est_inventory_justify"],
  metas: ["meta_faturamento", "meta_vendas_count", "meta_novos_clientes"],
  condicional: ["cond_max_days"],
  impressao: ["imp_auto_print", "imp_coupon_copies"],
};

function defaultsMap() {
  return {
    vendas_max_discount_pct: "10",
    vendas_cancel_minutes: "30",
    vendas_allow_below_cost: "false",
    pay_credit: "true",
    pay_debit: "true",
    pay_pix: "true",
    pay_cash: "true",
    pay_max_installments: "12",
    est_min_qty_alert: "5",
    est_inventory_justify: "true",
    meta_faturamento: "320000",
    meta_vendas_count: "1500",
    meta_novos_clientes: "150",
    cond_max_days: "30",
    imp_auto_print: "false",
    imp_coupon_copies: "1",
  };
}

function boolStr(v) {
  return v === true || v === "true" ? "true" : "false";
}

export default function ParametrosTab({ onDirtyChange }) {
  const theme = useTheme();
  const ui = useMemo(() => configUiPalette(theme), [theme]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState(defaultsMap());
  const [snapshots, setSnapshots] = useState({});
  const [empresa, setEmpresa] = useState(defaultEmpresa);
  const [empresaSnap, setEmpresaSnap] = useState(JSON.stringify(defaultEmpresa));
  const [saving, setSaving] = useState({});

  const cardSx = {
    p: 2.5,
    borderRadius: VEX.radiusCard,
    bgcolor: ui.bgCard,
    border: `1px solid ${ui.border}`,
    color: ui.textPrimary,
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchSettingsMap();
      const merged = { ...defaultsMap(), ...remote };
      setValues(merged);
      const snaps = {};
      Object.keys(GROUP_KEYS).forEach((g) => {
        const slice = {};
        GROUP_KEYS[g].forEach((k) => {
          slice[k] = merged[k];
        });
        snaps[g] = JSON.stringify(slice);
      });
      setSnapshots(snaps);
      try {
        const raw = localStorage.getItem(STORAGE_EMPRESA);
        const parsed = raw ? JSON.parse(raw) : {};
        const em = {
          nomeEmpresa: parsed.nomeEmpresa || "",
          cnpj: parsed.cnpj || "",
          telefone: parsed.telefone || "",
          emailContato: parsed.email || parsed.emailContato || "",
        };
        setEmpresa(em);
        setEmpresaSnap(JSON.stringify(em));
      } catch {
        setEmpresa(defaultEmpresa);
        setEmpresaSnap(JSON.stringify(defaultEmpresa));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirtyGroups = useMemo(() => {
    const d = {};
    Object.keys(GROUP_KEYS).forEach((g) => {
      const slice = {};
      GROUP_KEYS[g].forEach((k) => {
        slice[k] = values[k];
      });
      d[g] = JSON.stringify(slice) !== snapshots[g];
    });
    const empDirty = JSON.stringify(empresa) !== empresaSnap;
    return { ...d, empresa: empDirty };
  }, [values, snapshots, empresa, empresaSnap]);

  const anyDirty = useMemo(
    () => Object.values(dirtyGroups).some(Boolean),
    [dirtyGroups],
  );

  useEffect(() => {
    onDirtyChange?.(anyDirty);
  }, [anyDirty, onDirtyChange]);

  const setVal = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));

  const saveGroup = async (groupId) => {
    const keys = GROUP_KEYS[groupId];
    if (!keys) return;
    setSaving((s) => ({ ...s, [groupId]: true }));
    try {
      const entries = keys.map((k) => ({ key: k, value: values[k] }));
      await bulkUpdateSettings(entries);
      const slice = {};
      keys.forEach((k) => {
        slice[k] = values[k];
      });
      setSnapshots((prev) => ({ ...prev, [groupId]: JSON.stringify(slice) }));
      showSuccess("Parâmetros atualizados com sucesso");
    } catch (e) {
      showError(e?.response?.data?.message || "Erro ao salvar parâmetros.");
    } finally {
      setSaving((s) => ({ ...s, [groupId]: false }));
    }
  };

  const saveEmpresa = () => {
    setSaving((s) => ({ ...s, empresa: true }));
    try {
      const raw = localStorage.getItem(STORAGE_EMPRESA);
      let prev = {};
      try {
        prev = raw ? JSON.parse(raw) : {};
      } catch {
        prev = {};
      }
      const merged = {
        ...prev,
        nomeEmpresa: empresa.nomeEmpresa,
        cnpj: empresa.cnpj,
        telefone: empresa.telefone,
        email: empresa.emailContato,
      };
      localStorage.setItem(STORAGE_EMPRESA, JSON.stringify(merged));
      const snap = {
        nomeEmpresa: empresa.nomeEmpresa,
        cnpj: empresa.cnpj,
        telefone: empresa.telefone,
        emailContato: empresa.emailContato,
      };
      setEmpresaSnap(JSON.stringify(snap));
      showSuccess("Dados da empresa salvos.");
    } catch {
      showError("Erro ao salvar.");
    } finally {
      setSaving((s) => ({ ...s, empresa: false }));
    }
  };

  const fieldSx = (dirty) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: VEX.radiusInput,
      bgcolor: ui.bgInput,
      color: ui.textPrimary,
      ...(dirty ? { "& fieldset": { borderColor: ui.accent } } : {}),
    },
    "& .MuiInputLabel-root": { color: ui.textSecondary },
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={160} sx={{ bgcolor: ui.skeletonBg }} />
        ))}
      </Box>
    );
  }

  const creditOn = values.pay_credit === "true";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Alert
        severity="info"
        sx={{
          bgcolor: ui.alertTintBg,
          color: ui.textSecondary,
          border: `1px solid ${ui.border}`,
          "& .MuiAlert-icon": { color: ui.accent },
        }}
      >
        Cada grupo possui salvar próprio. Campos alterados ganham borda amarela até salvar. Integração:{" "}
        <strong>GET /settings</strong> e <strong>PUT /settings/bulk</strong> — fallback em localStorage se a API não existir.
      </Alert>

      {/* Empresa (legado vexa_config) */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.empresa ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: ui.accent }}>
          Identidade da loja
        </Typography>
        <Typography variant="caption" sx={{ color: ui.textSecondary, display: "block", mb: 2 }}>
          Persistido em localStorage (<code>vexa_config</code>), compatível com o fluxo anterior do VEXA.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Nome da empresa"
              value={empresa.nomeEmpresa}
              onChange={(e) => setEmpresa((p) => ({ ...p, nomeEmpresa: e.target.value }))}
              sx={fieldSx(dirtyGroups.empresa)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="CNPJ"
              value={empresa.cnpj}
              onChange={(e) => setEmpresa((p) => ({ ...p, cnpj: e.target.value }))}
              sx={fieldSx(dirtyGroups.empresa)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Telefone"
              value={empresa.telefone}
              onChange={(e) => setEmpresa((p) => ({ ...p, telefone: e.target.value }))}
              sx={fieldSx(dirtyGroups.empresa)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="E-mail"
              value={empresa.emailContato}
              onChange={(e) => setEmpresa((p) => ({ ...p, emailContato: e.target.value }))}
              sx={fieldSx(dirtyGroups.empresa)}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.empresa || saving.empresa}
            onClick={saveEmpresa}
            sx={{
              textTransform: "none",
              borderRadius: VEX.radiusInput,
              bgcolor: ui.accent,
              color: ui.accentContrast,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            {saving.empresa ? "Salvando..." : "Salvar identidade"}
          </Button>
        </Box>
      </Paper>

      {/* Vendas */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.vendas ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Vendas
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Desconto máximo do vendedor"
              value={values.vendas_max_discount_pct}
              onChange={(e) => setVal("vendas_max_discount_pct", e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              inputProps={{ min: 0, max: 100 }}
              sx={fieldSx(dirtyGroups.vendas)}
            />
            <Typography variant="caption" sx={{ color: ui.textMuted, mt: 0.5, display: "block" }}>
              Vendedores não podem aplicar descontos acima deste valor sem aprovação de um gerente.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Prazo cancelamento sem aprovação"
              value={values.vendas_cancel_minutes}
              onChange={(e) => setVal("vendas_cancel_minutes", e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
              sx={fieldSx(dirtyGroups.vendas)}
            />
            <Typography variant="caption" sx={{ color: ui.textMuted, mt: 0.5, display: "block" }}>
              Dentro deste prazo a venda pode ser cancelada livremente; após, exige gerente.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.vendas_allow_below_cost === "true"}
                  onChange={(e) => setVal("vendas_allow_below_cost", boolStr(e.target.checked))}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: ui.accent } }}
                />
              }
              label="Permitir venda abaixo do custo"
              sx={{ color: ui.textSecondary, mt: 1 }}
            />
            <Typography variant="caption" sx={{ color: ui.textMuted, display: "block" }}>
              Se desativado, bloqueia preço de venda abaixo do custo de aquisição.
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.vendas || saving.vendas}
            onClick={() => saveGroup("vendas")}
            sx={{
              textTransform: "none",
              borderRadius: VEX.radiusInput,
              bgcolor: ui.accent,
              color: ui.accentContrast,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </Paper>

      {/* Pagamentos */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.pagamentos ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Pagamentos
        </Typography>
        <FormGroup row sx={{ gap: 2, flexWrap: "wrap", mb: 2 }}>
          {[
            ["pay_credit", "Crédito"],
            ["pay_debit", "Débito"],
            ["pay_pix", "Pix"],
            ["pay_cash", "Dinheiro"],
          ].map(([key, lab]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={values[key] === "true"}
                  onChange={(e) => setVal(key, boolStr(e.target.checked))}
                  sx={{ color: ui.textSecondary, "&.Mui-checked": { color: ui.accent } }}
                />
              }
              label={lab}
              sx={{ color: ui.textSecondary }}
            />
          ))}
        </FormGroup>
        <TextField
          size="small"
          type="number"
          label="Parcelamento máximo (crédito)"
          disabled={!creditOn}
          value={values.pay_max_installments}
          onChange={(e) => setVal("pay_max_installments", e.target.value)}
          inputProps={{ min: 1, max: 24 }}
          sx={{ ...fieldSx(dirtyGroups.pagamentos), maxWidth: 280 }}
        />
        <Typography variant="caption" sx={{ color: ui.textMuted, display: "block", mt: 1 }}>
          Pelo menos uma forma de pagamento deve permanecer ativa (validação ao salvar).
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.pagamentos || saving.pagamentos}
            onClick={() => {
              const anyPay = ["pay_credit", "pay_debit", "pay_pix", "pay_cash"].some((k) => values[k] === "true");
              if (!anyPay) {
                showError("Marque pelo menos uma forma de pagamento.");
                return;
              }
              saveGroup("pagamentos");
            }}
            sx={{
              textTransform: "none",
              borderRadius: VEX.radiusInput,
              bgcolor: ui.accent,
              color: ui.accentContrast,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </Paper>

      {/* Estoque */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.estoque ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Estoque
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Quantidade mínima padrão (alerta)"
              value={values.est_min_qty_alert}
              onChange={(e) => setVal("est_min_qty_alert", e.target.value)}
              sx={fieldSx(dirtyGroups.estoque)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.est_inventory_justify === "true"}
                  onChange={(e) => setVal("est_inventory_justify", boolStr(e.target.checked))}
                />
              }
              label="Justificativa obrigatória em ajuste de inventário"
              sx={{ color: ui.textSecondary, mt: 1 }}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.estoque || saving.estoque}
            onClick={() => saveGroup("estoque")}
            sx={{
              textTransform: "none",
              bgcolor: ui.accent,
              color: ui.accentContrast,
              borderRadius: VEX.radiusInput,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </Paper>

      {/* Metas */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.metas ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Metas do mês
        </Typography>
        <Typography variant="caption" sx={{ color: ui.textMuted, mb: 2, display: "block" }}>
          Podem ser lidas pelo Dashboard quando o backend expuser os mesmos valores (hoje o Dashboard usa metas locais).
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Meta faturamento (R$)"
              value={values.meta_faturamento}
              onChange={(e) => setVal("meta_faturamento", e.target.value)}
              sx={fieldSx(dirtyGroups.metas)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Meta número de vendas"
              value={values.meta_vendas_count}
              onChange={(e) => setVal("meta_vendas_count", e.target.value)}
              sx={fieldSx(dirtyGroups.metas)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Meta novos clientes"
              value={values.meta_novos_clientes}
              onChange={(e) => setVal("meta_novos_clientes", e.target.value)}
              sx={fieldSx(dirtyGroups.metas)}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.metas || saving.metas}
            onClick={() => saveGroup("metas")}
            sx={{
              textTransform: "none",
              bgcolor: ui.accent,
              color: ui.accentContrast,
              borderRadius: VEX.radiusInput,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </Paper>

      {/* Condicional */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.condicional ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Condicional
        </Typography>
        <TextField
          size="small"
          type="number"
          label="Prazo máximo de condicional"
          value={values.cond_max_days}
          onChange={(e) => setVal("cond_max_days", e.target.value)}
          InputProps={{ endAdornment: <InputAdornment position="end">dias</InputAdornment> }}
          sx={{ ...fieldSx(dirtyGroups.condicional), maxWidth: 280 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.condicional || saving.condicional}
            onClick={() => saveGroup("condicional")}
            sx={{
              textTransform: "none",
              bgcolor: ui.accent,
              color: ui.accentContrast,
              borderRadius: VEX.radiusInput,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </Paper>

      {/* Impressão */}
      <Paper elevation={0} sx={{ ...cardSx, ...(dirtyGroups.impressao ? { borderColor: ui.accent } : {}) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Impressão
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={values.imp_auto_print === "true"}
              onChange={(e) => setVal("imp_auto_print", boolStr(e.target.checked))}
            />
          }
          label="Impressão automática ao finalizar venda"
          sx={{ color: ui.textSecondary, mb: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: ui.textSecondary }}>Vias do cupom</InputLabel>
          <Select
            label="Vias do cupom"
            value={values.imp_coupon_copies}
            onChange={(e) => setVal("imp_coupon_copies", e.target.value)}
            sx={{ bgcolor: ui.bgInput, color: ui.textPrimary, borderRadius: VEX.radiusInput }}
          >
            <MenuItem value="1">1 via</MenuItem>
            <MenuItem value="2">2 vias</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!dirtyGroups.impressao || saving.impressao}
            onClick={() => saveGroup("impressao")}
            sx={{
              textTransform: "none",
              bgcolor: ui.accent,
              color: ui.accentContrast,
              borderRadius: VEX.radiusInput,
              "&:hover": { bgcolor: ui.isDark ? "#e6b415" : theme.palette.primary.dark },
            }}
          >
            Salvar alterações
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
