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
  LightMode,
  RestartAlt,
  Save,
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

const LS_SELECTED_EMPRESA_KEY = "personalizacao_selected_empresa_id";

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
  const [logoError, setLogoError] = useState("");

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

  const handleDiscard = () => {
    if (!form) return;
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
