import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AdminPanelSettings, Palette, Tune } from "@mui/icons-material";
import PermissoesTab from "./PermissoesTab";
import ParametrosTab from "./ParametrosTab";
import PersonalizacaoTab from "./PersonalizacaoTab";
import { authService } from "../../api/authService";
import { isDevAdminUser } from "../../constants/devAdmin";
import { configUiPalette, VEX } from "./configuracoesHelpers";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ marginTop: 16 }}>
      {value === index ? children : null}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const theme = useTheme();
  const ui = useMemo(() => configUiPalette(theme), [theme]);
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [tab, setTab] = useState(0);
  const [paramDirty, setParamDirty] = useState(false);
  const isDev = useMemo(() => isDevAdminUser(authService.getUsuario()), []);
  const personalizacaoTabIndex = 2;

  useEffect(() => {
    const beforeUnload = (e) => {
      if (!paramDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [paramDirty]);

  const handleTabChange = useCallback(
    (next) => {
      if (tab === 1 && paramDirty && next !== 1) {
        const ok = window.confirm(
          "Você tem alterações não salvas nos Parâmetros. Deseja sair mesmo assim?",
        );
        if (!ok) return;
      }
      setTab(next);
    },
    [tab, paramDirty],
  );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100vh",
        bgcolor: theme.palette.mode === "dark" ? VEX.bgBase : theme.palette.background.default,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.mode === "dark" ? VEX.textPrimary : "text.primary", letterSpacing: "-0.02em" }}>
          Configurações do sistema
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.mode === "dark" ? VEX.textSecondary : "text.secondary", mt: 0.5 }}>
          Permissões de usuários e parâmetros operacionais (administradores).
        </Typography>
      </Box>

      {isMdUp ? (
        <Tabs
          value={tab}
          onChange={(_, v) => handleTabChange(v)}
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              color: theme.palette.mode === "dark" ? VEX.textSecondary : "text.secondary",
              minHeight: 44,
            },
            "& .Mui-selected": { color: `${ui.accent} !important` },
            "& .MuiTabs-indicator": { bgcolor: ui.accent, height: 3 },
          }}
        >
          <Tab icon={<AdminPanelSettings fontSize="small" />} iconPosition="start" label="Permissões de usuários" />
          <Tab icon={<Tune fontSize="small" />} iconPosition="start" label="Parâmetros do sistema" />
          {isDev && (
            <Tab icon={<Palette fontSize="small" />} iconPosition="start" label="Personalização" />
          )}
        </Tabs>
      ) : (
        <FormControl fullWidth size="small">
          <InputLabel>Seção</InputLabel>
          <Select
            label="Seção"
            value={tab}
            onChange={(e) => handleTabChange(Number(e.target.value))}
            sx={{
              borderRadius: 2,
              bgcolor: ui.bgInput,
              color: ui.textPrimary,
            }}
          >
            <MenuItem value={0}>Permissões de usuários</MenuItem>
            <MenuItem value={1}>Parâmetros do sistema</MenuItem>
            {isDev && (
              <MenuItem value={personalizacaoTabIndex}>Personalização</MenuItem>
            )}
          </Select>
        </FormControl>
      )}

      <TabPanel value={tab} index={0}>
        <PermissoesTab />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <ParametrosTab onDirtyChange={setParamDirty} />
      </TabPanel>
      {isDev && (
        <TabPanel value={tab} index={personalizacaoTabIndex}>
          <PersonalizacaoTab />
        </TabPanel>
      )}
    </Box>
  );
}
