import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloudUpload,
  DarkMode,
  Delete,
  Info,
  LightMode,
  Palette,
  Preview,
  RestartAlt,
  Save,
  Visibility,
  VisibilityOff,
  Warning,
} from "@mui/icons-material";
import {
  fetchCompanySettings,
  removeCompanyLogo,
  updateCompanyModules,
  updateCompanySettings,
  uploadCompanyLogo,
  validateLogoFile,
} from "../../api/companySettingsService";
import { useEmpresa } from "../../contexts/EmpresaContext";
import { useCompanySettings } from "../../contexts/CompanySettingsContext";
import {
  MANDATORY_MODULE_KEYS,
  MODULE_CATEGORIES,
  MODULES,
  getDependentsOf,
  getModule,
  getUnmetDependencies,
} from "../../constants/modules";
import { showError, showSuccess } from "../../utils/notifications";
import { configUiPalette, VEX } from "./configuracoesHelpers";

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
const LS_SELECTED_EMPRESA_KEY = "personalizacao_selected_empresa_id";

/**
 * Combinações primária + secundária testadas no layout. A primeira (VEXA Neon)
 * corresponde ao padrão histórico do sistema. As demais foram escolhidas com
 * bom contraste em tema claro e escuro.
 */
const COLOR_PRESETS = [
  { name: "VEXA Neon",         primary: "#F8F32B", secondary: "#2B2D42" },
  { name: "Azul Corporativo",  primary: "#2563EB", secondary: "#1E293B" },
  { name: "Verde Esmeralda",   primary: "#10B981", secondary: "#064E3B" },
  { name: "Roxo Royal",        primary: "#7C3AED", secondary: "#4C1D95" },
  { name: "Laranja Vibrante",  primary: "#F97316", secondary: "#7C2D12" },
  { name: "Rosa Magenta",      primary: "#EC4899", secondary: "#831843" },
  { name: "Ciano Moderno",     primary: "#06B6D4", secondary: "#155E75" },
  { name: "Vermelho Vinho",    primary: "#DC2626", secondary: "#7F1D1D" },
  { name: "Âmbar Clássico",    primary: "#D97706", secondary: "#451A03" },
  { name: "Grafite",           primary: "#475569", secondary: "#0F172A" },
];

function isHex(c) {
  return typeof c === "string" && HEX_REGEX.test(c);
}

function snapshotOf(s) {
  return JSON.stringify({
    display_name: s.display_name,
    primary_color: s.primary_color,
    secondary_color: s.secondary_color,
    default_theme: s.default_theme,
    logo_url: s.logo_url || null,
    enabled_modules: [...(s.enabled_modules || [])].sort(),
  });
}

export default function PersonalizacaoTab() {
  const theme = useTheme();
  const ui = useMemo(() => configUiPalette(theme), [theme]);
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const { empresas, empresaAtiva } = useEmpresa();
  const { settings: globalSettings, updateLocal } = useCompanySettings();

  const [selectedEmpresaId, setSelectedEmpresaId] = useState(() => {
    const stored = localStorage.getItem(LS_SELECTED_EMPRESA_KEY);
    if (stored) return Number(stored);
    if (empresaAtiva?.id != null) return empresaAtiva.id;
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [baseSnap, setBaseSnap] = useState("");
  const [previewOn, setPreviewOn] = useState(false);
  const previewSnapRef = useRef(null);
  const [logoError, setLogoError] = useState("");
  const [hexErr, setHexErr] = useState({ primary: false, secondary: false });

  const [confirmEnable, setConfirmEnable] = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(null);

  // Persistir empresa selecionada
  useEffect(() => {
    if (selectedEmpresaId != null) {
      localStorage.setItem(LS_SELECTED_EMPRESA_KEY, String(selectedEmpresaId));
    }
  }, [selectedEmpresaId]);

  // Selecionar a primeira empresa disponível quando a lista carregar.
  useEffect(() => {
    if (selectedEmpresaId != null) return;
    if (empresas?.length) setSelectedEmpresaId(empresas[0].id);
  }, [empresas, selectedEmpresaId]);

  const empresaSelecionada = useMemo(
    () => empresas?.find((e) => e.id === selectedEmpresaId) || null,
    [empresas, selectedEmpresaId],
  );

  const loadEmpresaSettings = useCallback(async (id) => {
    if (id == null) return;
    setLoading(true);
    try {
      const data = await fetchCompanySettings(id);
      setForm(data);
      setBaseSnap(snapshotOf(data));
      setHexErr({ primary: false, secondary: false });
      setLogoError("");
    } catch (e) {
      showError("Erro ao carregar configurações da empresa.");
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmpresaSettings(selectedEmpresaId);
  }, [selectedEmpresaId, loadEmpresaSettings]);

  // Encerrar preview ao desmontar / trocar empresa.
  useEffect(() => {
    return () => {
      if (previewSnapRef.current) {
        updateLocal(previewSnapRef.current);
        previewSnapRef.current = null;
      }
    };
  }, [updateLocal]);

  useEffect(() => {
    if (previewOn) {
      setPreviewOn(false);
      if (previewSnapRef.current) {
        updateLocal(previewSnapRef.current);
        previewSnapRef.current = null;
      }
    }
    // intencionalmente sem dependência de updateLocal/previewOn — resetamos ao trocar empresa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpresaId]);

  const dirty = useMemo(() => {
    if (!form) return false;
    return snapshotOf(form) !== baseSnap;
  }, [form, baseSnap]);

  // Bloquear close acidental do navegador.
  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const isEditingLoggedCompany =
    empresaSelecionada?.id != null &&
    (empresaAtiva?.id === empresaSelecionada.id ||
      // Quando dev ainda não "entrou" em empresa, o painel reflete a empresa do user.
      (!empresaAtiva && globalSettings && empresaSelecionada.id != null));

  const togglePreview = () => {
    if (!form) return;
    if (previewOn) {
      // Restaurar
      if (previewSnapRef.current) {
        updateLocal(previewSnapRef.current);
        previewSnapRef.current = null;
      }
      setPreviewOn(false);
      return;
    }
    if (hexErr.primary || hexErr.secondary) {
      showError("Corrija o hex inválido antes de pré-visualizar.");
      return;
    }
    previewSnapRef.current = {
      primary_color: globalSettings.primary_color,
      secondary_color: globalSettings.secondary_color,
      default_theme: globalSettings.default_theme,
    };
    updateLocal({
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      default_theme: form.default_theme,
    });
    setPreviewOn(true);
  };

  const handleDiscard = () => {
    if (!form) return;
    if (previewOn && previewSnapRef.current) {
      updateLocal(previewSnapRef.current);
      previewSnapRef.current = null;
      setPreviewOn(false);
    }
    loadEmpresaSettings(selectedEmpresaId);
  };

  const handleSelectFile = async (file) => {
    if (!file) return;
    const err = validateLogoFile(file);
    if (err) {
      setLogoError(err);
      return;
    }
    setLogoError("");
    setSaving(true);
    try {
      const { logo_url, backendOk } = await uploadCompanyLogo(
        selectedEmpresaId,
        file,
      );
      setForm((prev) => ({ ...prev, logo_url }));
      setBaseSnap((prev) => {
        // Atualiza o snapshot só para logo, sem afetar outros campos editados.
        try {
          const parsed = JSON.parse(prev);
          parsed.logo_url = logo_url;
          return JSON.stringify(parsed);
        } catch {
          return prev;
        }
      });
      if (isEditingLoggedCompany) updateLocal({ logo_url });
      showSuccess(
        backendOk ? "Logo enviado." : "Logo salvo localmente (API ausente).",
      );
    } catch (e) {
      showError(e?.message || "Falha ao enviar logo.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!form?.logo_url) return;
    setSaving(true);
    try {
      const { backendOk } = await removeCompanyLogo(selectedEmpresaId);
      setForm((prev) => ({ ...prev, logo_url: null }));
      setBaseSnap((prev) => {
        try {
          const parsed = JSON.parse(prev);
          parsed.logo_url = null;
          return JSON.stringify(parsed);
        } catch {
          return prev;
        }
      });
      if (isEditingLoggedCompany) updateLocal({ logo_url: null });
      showSuccess(backendOk ? "Logo removido." : "Logo removido (local).");
    } catch (e) {
      showError(e?.message || "Falha ao remover logo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form || !selectedEmpresaId) return;
    if (hexErr.primary || hexErr.secondary) {
      showError("Cores em formato inválido. Use #RRGGBB.");
      return;
    }
    if (!form.display_name?.trim()) {
      showError("Nome de exibição é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      // Sequencial (não paralelo): cada call lê o localStorage antes de salvar.
      // Em paralelo ambas leriam o estado antigo e a última sobrescreveria a
      // primeira, fazendo a cor "voltar ao padrão" ao salvar módulos.
      await updateCompanySettings(selectedEmpresaId, {
        display_name: form.display_name.trim(),
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        default_theme: form.default_theme,
      });
      const { settings: merged } = await updateCompanyModules(
        selectedEmpresaId,
        form.enabled_modules,
      );
      setForm(merged);
      setBaseSnap(snapshotOf(merged));
      if (previewOn) {
        previewSnapRef.current = null;
        setPreviewOn(false);
      }
      if (isEditingLoggedCompany) {
        updateLocal({
          display_name: merged.display_name,
          primary_color: merged.primary_color,
          secondary_color: merged.secondary_color,
          default_theme: merged.default_theme,
          enabled_modules: merged.enabled_modules,
        });
        // Não disparar refresh aqui: o fallback (sem backend) reverteria
        // para os defaults. updateLocal já reflete o estado mais recente.
      }
      showSuccess("Configurações salvas.");
    } catch (e) {
      showError(e?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, value) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  // === Módulos: handlers
  const enabledSet = useMemo(
    () => new Set(form?.enabled_modules || []),
    [form],
  );

  const tryToggleModule = (moduleKey, nextEnabled) => {
    if (!form) return;
    const def = getModule(moduleKey);
    if (!def || def.mandatory) return;

    if (nextEnabled) {
      const { missing, requiresAnyLabel } = getUnmetDependencies(
        moduleKey,
        enabledSet,
      );
      if (missing.length > 0 || requiresAnyLabel) {
        setConfirmEnable({ moduleKey, missing, requiresAnyLabel });
        return;
      }
      applyModuleChange(moduleKey, true);
    } else {
      const dependents = getDependentsOf(moduleKey, enabledSet);
      if (dependents.length > 0) {
        setConfirmDisable({ moduleKey, dependents });
        return;
      }
      applyModuleChange(moduleKey, false);
    }
  };

  const applyModuleChange = (moduleKey, nextEnabled, extraToggleOff = []) => {
    setForm((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.enabled_modules || []);
      if (nextEnabled) set.add(moduleKey);
      else set.delete(moduleKey);
      extraToggleOff.forEach((k) => set.delete(k));
      MANDATORY_MODULE_KEYS.forEach((k) => set.add(k));
      return { ...prev, enabled_modules: Array.from(set) };
    });
  };

  // Agrupa módulos por categoria, na ordem definida.
  const modulesByCategory = useMemo(() => {
    const map = MODULE_CATEGORIES.reduce((acc, c) => {
      acc[c.key] = { ...c, items: [] };
      return acc;
    }, {});
    MODULES.forEach((m) => {
      if (m.devOnly) return; // o módulo "Empresas" não entra na lista (sempre dev-only)
      if (!map[m.category]) return;
      map[m.category].items.push(m);
    });
    return Object.values(map).filter((c) => c.items.length > 0);
  }, []);

  // === UI tokens
  const cardSx = {
    p: 2.5,
    borderRadius: VEX.radiusCard,
    bgcolor: ui.bgCard,
    border: `1px solid ${ui.border}`,
    color: ui.textPrimary,
  };

  const sectionTitleSx = {
    fontWeight: 700,
    color: ui.textPrimary,
    mb: 0.5,
  };

  const sectionHintSx = {
    color: ui.textSecondary,
    mb: 2,
    display: "block",
  };

  if (!empresas?.length && !empresaSelecionada) {
    return (
      <Alert
        severity="info"
        sx={{
          bgcolor: ui.alertTintBg,
          color: ui.textSecondary,
          border: `1px solid ${ui.border}`,
        }}
      >
        Nenhuma empresa cadastrada. Cadastre empresas em{" "}
        <strong>Administração → Empresas</strong>.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Indicador de alterações não salvas */}
      {dirty && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{
            bgcolor: "transparent",
            borderColor: theme.palette.warning.main,
            color: ui.textPrimary,
            "& .MuiAlert-icon": { color: theme.palette.warning.main },
          }}
        >
          Você tem alterações não salvas.
        </Alert>
      )}

      {/* Seção 1 — seletor de empresa */}
      <Paper elevation={0} sx={cardSx}>
        <Typography variant="subtitle1" sx={sectionTitleSx}>
          Empresa
        </Typography>
        <Typography variant="caption" sx={sectionHintSx}>
          As configurações abaixo se aplicam à empresa selecionada.
        </Typography>
        <FormControl size="small" fullWidth>
          <InputLabel id="empresa-select">Empresa</InputLabel>
          <Select
            labelId="empresa-select"
            label="Empresa"
            value={selectedEmpresaId ?? ""}
            onChange={(e) => setSelectedEmpresaId(Number(e.target.value))}
            disabled={!empresas?.length}
          >
            {(empresas || []).map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.nome || e.nomeFantasia || `Empresa #${e.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {loading || !form ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={180}
              sx={{ bgcolor: ui.skeletonBg }}
            />
          ))}
        </Stack>
      ) : (
        <>
          <IdentidadeCard
            form={form}
            setField={setField}
            onUpload={handleSelectFile}
            onRemoveLogo={handleRemoveLogo}
            logoError={logoError}
            saving={saving}
            cardSx={cardSx}
            sectionTitleSx={sectionTitleSx}
            sectionHintSx={sectionHintSx}
            ui={ui}
          />

          <CoresCard
            form={form}
            setField={setField}
            hexErr={hexErr}
            setHexErr={setHexErr}
            previewOn={previewOn}
            onTogglePreview={togglePreview}
            cardSx={cardSx}
            sectionTitleSx={sectionTitleSx}
            sectionHintSx={sectionHintSx}
            ui={ui}
          />

          <ModulosCard
            modulesByCategory={modulesByCategory}
            enabledSet={enabledSet}
            onToggle={tryToggleModule}
            cardSx={cardSx}
            sectionTitleSx={sectionTitleSx}
            sectionHintSx={sectionHintSx}
            ui={ui}
          />

          {/* Seção 5 — Ações */}
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              backdropFilter: "saturate(140%) blur(6px)",
            }}
          >
            <Stack
              direction={isSmDown ? "column" : "row"}
              spacing={1.5}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                startIcon={<RestartAlt />}
                disabled={!dirty || saving}
                onClick={handleDiscard}
                sx={{ textTransform: "none" }}
              >
                Descartar
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                disabled={!dirty || saving}
                onClick={handleSave}
                sx={{
                  textTransform: "none",
                  bgcolor: ui.accent,
                  color: ui.accentContrast,
                  "&:hover": {
                    bgcolor: ui.isDark
                      ? theme.palette.primary.dark
                      : theme.palette.primary.dark,
                  },
                }}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </Stack>
          </Paper>
        </>
      )}

      {/* Modais */}
      <Dialog
        open={!!confirmEnable}
        onClose={() => setConfirmEnable(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" /> Dependência não atendida
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {(() => {
              if (!confirmEnable) return null;
              const def = getModule(confirmEnable.moduleKey);
              const missingLabels = (confirmEnable.missing || [])
                .map((k) => getModule(k)?.label || k)
                .join(", ");
              return (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Para ativar <strong>{def?.label}</strong>, você precisa
                    ativar antes:
                  </Typography>
                  {missingLabels && (
                    <Typography variant="body2" color="text.primary">
                      • {missingLabels}
                    </Typography>
                  )}
                  {confirmEnable.requiresAnyLabel && (
                    <Typography variant="body2" color="text.primary">
                      • {confirmEnable.requiresAnyLabel}
                    </Typography>
                  )}
                </Stack>
              );
            })()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmEnable(null)}
            sx={{ textTransform: "none" }}
          >
            Entendi
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmDisable}
        onClose={() => setConfirmDisable(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" /> Existem módulos dependentes
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {(() => {
              if (!confirmDisable) return null;
              const def = getModule(confirmDisable.moduleKey);
              return (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Os módulos abaixo dependem de{" "}
                    <strong>{def?.label}</strong> e serão desativados também:
                  </Typography>
                  {confirmDisable.dependents.map((d) => (
                    <Typography
                      key={d.key}
                      variant="body2"
                      color="text.primary"
                    >
                      • {d.label}
                    </Typography>
                  ))}
                </Stack>
              );
            })()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDisable(null)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
            onClick={() => {
              const ids = confirmDisable.dependents.map((d) => d.key);
              applyModuleChange(confirmDisable.moduleKey, false, ids);
              setConfirmDisable(null);
            }}
          >
            Desativar tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ========== Subcomponentes ========== */

function IdentidadeCard({
  form,
  setField,
  onUpload,
  onRemoveLogo,
  logoError,
  saving,
  cardSx,
  sectionTitleSx,
  sectionHintSx,
  ui,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <Paper elevation={0} sx={cardSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        Identidade visual
      </Typography>
      <Typography variant="caption" sx={sectionHintSx}>
        Logo, nome exibido no header e tema padrão da empresa.
      </Typography>

      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            sx={{
              border: `2px dashed ${dragOver ? ui.accent : ui.border}`,
              borderRadius: 2,
              p: 2,
              bgcolor: ui.bgInput,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              minHeight: 180,
              justifyContent: "center",
              transition: "border-color 120ms ease",
            }}
          >
            {form.logo_url ? (
              <Box
                component="img"
                src={form.logo_url}
                alt="Logo da empresa"
                sx={{
                  maxHeight: 90,
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  bgcolor: ui.accent,
                  color: ui.accentContrast,
                  width: 72,
                  height: 72,
                  fontWeight: 700,
                  fontSize: 28,
                }}
              >
                {(form.display_name?.[0] || "V").toUpperCase()}
              </Avatar>
            )}
            <Typography variant="caption" sx={{ color: ui.textSecondary }}>
              Arraste o arquivo ou use os botões abaixo (PNG, SVG, JPG, WEBP até 2 MB).
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUpload />}
                disabled={saving}
                onClick={() => inputRef.current?.click()}
                sx={{ textTransform: "none" }}
              >
                {form.logo_url ? "Trocar logo" : "Enviar logo"}
              </Button>
              {form.logo_url && (
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  disabled={saving}
                  onClick={onRemoveLogo}
                  sx={{ textTransform: "none" }}
                >
                  Remover
                </Button>
              )}
            </Stack>
            <input
              ref={inputRef}
              type="file"
              accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
              aria-label="Selecionar arquivo de logo"
            />
          </Box>
          {logoError && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 0.5, display: "block" }}
            >
              {logoError}
            </Typography>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Nome de exibição"
              value={form.display_name || ""}
              onChange={(e) => setField("display_name", e.target.value)}
              inputProps={{ maxLength: 100, "aria-label": "Nome de exibição" }}
              helperText="Substitui 'VEXA' no cabeçalho quando não há logo."
            />
            <Box>
              <Typography
                variant="body2"
                sx={{ color: ui.textSecondary, mb: 0.5 }}
              >
                Tema padrão
              </Typography>
              <ToggleButtonGroup
                value={form.default_theme || "dark"}
                exclusive
                onChange={(_, v) => v && setField("default_theme", v)}
                size="small"
                aria-label="Tema padrão"
              >
                <ToggleButton value="light" aria-label="Claro">
                  <LightMode fontSize="small" sx={{ mr: 0.5 }} /> Claro
                </ToggleButton>
                <ToggleButton value="dark" aria-label="Escuro">
                  <DarkMode fontSize="small" sx={{ mr: 0.5 }} /> Escuro
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                sx={{ color: ui.textSecondary, display: "block", mt: 0.5 }}
              >
                Tema escolhido aplica-se aos usuários da empresa no primeiro acesso.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}

function CoresCard({
  form,
  setField,
  hexErr,
  setHexErr,
  previewOn,
  onTogglePreview,
  cardSx,
  sectionTitleSx,
  sectionHintSx,
  ui,
}) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={cardSx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.5,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle1" sx={sectionTitleSx}>
          Cores do sistema
        </Typography>
        <Button
          size="small"
          variant={previewOn ? "contained" : "outlined"}
          startIcon={previewOn ? <VisibilityOff /> : <Visibility />}
          onClick={onTogglePreview}
          sx={{
            textTransform: "none",
            ...(previewOn && {
              bgcolor: ui.accent,
              color: ui.accentContrast,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
            }),
          }}
        >
          {previewOn ? "Encerrar prévia" : "Visualizar prévia"}
        </Button>
      </Box>
      <Typography variant="caption" sx={sectionHintSx}>
        A prévia aplica as cores em tempo real no sistema (sem salvar).
      </Typography>

      <ColorPresets
        currentPrimary={form.primary_color}
        currentSecondary={form.secondary_color}
        onPick={(p) => {
          setField("primary_color", p.primary);
          setField("secondary_color", p.secondary);
          setHexErr({ primary: false, secondary: false });
        }}
        ui={ui}
      />

      <Grid container spacing={2}>
        <ColorRow
          label="Cor primária"
          value={form.primary_color}
          onChange={(v) => setField("primary_color", v)}
          error={hexErr.primary}
          setError={(b) => setHexErr((p) => ({ ...p, primary: b }))}
        />
        <ColorRow
          label="Cor secundária"
          value={form.secondary_color}
          onChange={(v) => setField("secondary_color", v)}
          error={hexErr.secondary}
          setError={(b) => setHexErr((p) => ({ ...p, secondary: b }))}
        />
      </Grid>

      <Alert
        severity="info"
        icon={<Info fontSize="small" />}
        sx={{
          mt: 2,
          bgcolor: ui.alertTintBg,
          color: ui.textSecondary,
          border: `1px solid ${ui.border}`,
          "& .MuiAlert-icon": { color: ui.accent },
        }}
      >
        Cores reservadas (verde de sucesso, vermelho de erro, azul de info) não são alteráveis.
      </Alert>
    </Paper>
  );
}

function ColorPresets({ currentPrimary, currentSecondary, onPick, ui }) {
  const theme = useTheme();
  const isMatch = (preset) =>
    preset.primary?.toUpperCase() === String(currentPrimary || "").toUpperCase() &&
    preset.secondary?.toUpperCase() === String(currentSecondary || "").toUpperCase();

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ color: ui.textSecondary, mb: 1, fontWeight: 600 }}>
        Combinações sugeridas
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {COLOR_PRESETS.map((preset) => {
          const selected = isMatch(preset);
          return (
            <Tooltip key={preset.name} title={`${preset.primary} · ${preset.secondary}`} arrow>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onPick(preset)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(preset);
                  }
                }}
                aria-label={`Aplicar preset ${preset.name}`}
                aria-pressed={selected}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 999,
                  border: `2px solid ${
                    selected ? theme.palette.primary.main : ui.border
                  }`,
                  bgcolor: selected ? ui.bgCardHover : ui.bgInput,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    transform: "translateY(-1px)",
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    "& > div": {
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `1.5px solid ${theme.palette.background.paper}`,
                    },
                    "& > div + div": { ml: "-6px" },
                  }}
                >
                  <Box sx={{ bgcolor: preset.primary }} />
                  <Box sx={{ bgcolor: preset.secondary }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: ui.textPrimary,
                    fontWeight: selected ? 700 : 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {preset.name}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

function ColorRow({ label, value, onChange, error, setError }) {
  const theme = useTheme();
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const safeApply = (next) => {
    setText(next);
    if (isHex(next)) {
      setError(false);
      onChange(next);
    } else if (/^#[0-9a-fA-F]{0,6}$/.test(next)) {
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleBlur = () => {
    if (!isHex(text)) {
      setError(true);
      return;
    }
    onChange(text.toUpperCase());
    setText(text.toUpperCase());
  };

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            bgcolor: isHex(value) ? value : "transparent",
          }}
        >
          <input
            type="color"
            value={isHex(value) ? value : "#000000"}
            onChange={(e) => safeApply(e.target.value.toUpperCase())}
            aria-label={`Seletor de ${label}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
              padding: 0,
              cursor: "pointer",
              opacity: 0,
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            size="small"
            label={label}
            value={text}
            onChange={(e) => safeApply(e.target.value)}
            onBlur={handleBlur}
            error={error}
            helperText={error ? "Use formato #RRGGBB" : " "}
            inputProps={{
              maxLength: 7,
              "aria-label": label,
              autoCapitalize: "characters",
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Palette fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Button
          variant="contained"
          size="small"
          disableElevation
          sx={{
            textTransform: "none",
            bgcolor: isHex(value) ? value : "transparent",
            color: theme.palette.getContrastText(isHex(value) ? value : "#FFFFFF"),
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 88,
            "&:hover": {
              bgcolor: isHex(value) ? value : "transparent",
              opacity: 0.92,
            },
          }}
        >
          Botão
        </Button>
      </Stack>
    </Grid>
  );
}

function ModulosCard({
  modulesByCategory,
  enabledSet,
  onToggle,
  cardSx,
  sectionTitleSx,
  sectionHintSx,
  ui,
}) {
  return (
    <Paper elevation={0} sx={cardSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        Módulos ativos
      </Typography>
      <Typography variant="caption" sx={sectionHintSx}>
        Ative/desative módulos para personalizar o menu e os acessos da empresa.
      </Typography>
      <Stack spacing={2.5} divider={<Divider flexItem />}>
        {modulesByCategory.map((cat) => (
          <Box key={cat.key}>
            <Typography
              variant="caption"
              sx={{
                color: ui.textSecondary,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {cat.label}
            </Typography>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
              {cat.items.map((m) => (
                <Grid key={m.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ModuleSwitch
                    moduleDef={m}
                    enabledSet={enabledSet}
                    onToggle={onToggle}
                    ui={ui}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function ModuleSwitch({ moduleDef, enabledSet, onToggle, ui }) {
  const isOn = moduleDef.mandatory || enabledSet.has(moduleDef.key);
  const { missing, requiresAnyLabel } = getUnmetDependencies(
    moduleDef.key,
    enabledSet,
  );
  const blockedByDep = !isOn && (missing.length > 0 || !!requiresAnyLabel);
  const hasDeps =
    (moduleDef.requires?.length || 0) +
      (moduleDef.requiresAny?.length || 0) >
    0;

  const tooltipText = moduleDef.mandatory
    ? "Módulo obrigatório"
    : hasDeps
      ? buildDepsTooltip(moduleDef)
      : moduleDef.description;

  return (
    <Box
      sx={{
        border: `1px solid ${ui.border}`,
        borderRadius: 2,
        p: 1.25,
        bgcolor: isOn ? ui.bgCardHover : ui.bgInput,
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        opacity: blockedByDep ? 0.7 : 1,
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isOn}
            disabled={moduleDef.mandatory || blockedByDep}
            onChange={(e) => onToggle(moduleDef.key, e.target.checked)}
            inputProps={{ "aria-label": `Ativar módulo ${moduleDef.label}` }}
          />
        }
        label={
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {moduleDef.label}
              </Typography>
              {moduleDef.mandatory && (
                <Tooltip title="Módulo obrigatório">
                  <Chip
                    size="small"
                    label="Sempre ativo"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      bgcolor: ui.neutralBadgeBg,
                      color: ui.textSecondary,
                    }}
                  />
                </Tooltip>
              )}
              {hasDeps && (
                <Tooltip title={tooltipText} arrow>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25, color: ui.textSecondary }}
                    aria-label={`Dependências de ${moduleDef.label}`}
                  >
                    <Warning sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" sx={{ color: ui.textSecondary }}>
              {moduleDef.description}
            </Typography>
            {blockedByDep && (
              <Typography
                variant="caption"
                sx={{ color: "error.main", mt: 0.5 }}
              >
                Requer:{" "}
                {missing.map((k) => getModule(k)?.label || k).join(", ")}
                {requiresAnyLabel
                  ? `${missing.length ? " e " : ""}${requiresAnyLabel}`
                  : ""}
              </Typography>
            )}
          </Box>
        }
        sx={{ alignItems: "flex-start", m: 0 }}
      />
    </Box>
  );
}

function buildDepsTooltip(def) {
  const parts = [];
  if (def.requires?.length) {
    parts.push(
      `Requer: ${def.requires.map((k) => getModule(k)?.label || k).join(", ")}`,
    );
  }
  if (def.requiresAny?.length) {
    parts.push(
      `Requer um de: ${def.requiresAny
        .map((k) => getModule(k)?.label || k)
        .join(" ou ")}`,
    );
  }
  return parts.join(" · ");
}
