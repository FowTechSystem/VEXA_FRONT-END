// src/pages/Configuracoes.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
} from "@mui/material";
import { Business, Language, Palette, Notifications } from "@mui/icons-material";
import { ThemeContext } from "../contexts/ThemeContext";
import { showSuccess, showError } from "../utils/notifications";

const STORAGE_KEY = "vexa_config";

const defaultConfig = {
  nomeEmpresa: "",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  fusoHorario: "America/Sao_Paulo",
  moeda: "BRL",
  idioma: "pt-BR",
  itensPorPagina: 20,
  notificacoesEmail: true,
  notificacoesSistema: true,
};

function Configuracoes() {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [config, setConfig] = useState(defaultConfig);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({ ...defaultConfig, ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Erro ao carregar configurações:", e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setTimeout(() => {
        setSalvando(false);
        showSuccess("Configurações salvas com sucesso!");
      }, 500);
    } catch (err) {
      setSalvando(false);
      showError("Erro ao salvar configurações.");
    }
  };

  const cardSx = {
    p: 3.5,
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    "&:hover": {
      borderColor: "action.hover",
      boxShadow: 1,
    },
  };

  const sectionHeaderSx = {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    mb: 2.5,
    pb: 1.5,
    borderBottom: "1px solid",
    borderColor: "divider",
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      transition: "background-color 0.2s ease, box-shadow 0.2s ease",
      "&:hover": { bgcolor: "action.hover" },
      "&.Mui-focused": { boxShadow: 1 },
    },
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.02em",
            }}
          >
            Configurações
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.9375rem" }}
          >
            Ajustes gerais do sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={salvando}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.25,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={cardSx}>
              <Box sx={sectionHeaderSx}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Business sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    letterSpacing: "0.02em",
                  }}
                >
                  Informações da Empresa
                </Typography>
              </Box>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Nome da Empresa"
                    name="nomeEmpresa"
                    value={config.nomeEmpresa}
                    onChange={handleChange}
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="CNPJ"
                    name="cnpj"
                    value={config.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    name="telefone"
                    value={config.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    name="email"
                    type="email"
                    value={config.email}
                    onChange={handleChange}
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Endereço"
                    name="endereco"
                    value={config.endereco}
                    onChange={handleChange}
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Cidade"
                    name="cidade"
                    value={config.cidade}
                    onChange={handleChange}
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Estado"
                    name="estado"
                    value={config.estado}
                    onChange={handleChange}
                    placeholder="UF"
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="CEP"
                    name="cep"
                    value={config.cep}
                    onChange={handleChange}
                    placeholder="00000-000"
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={cardSx}>
              <Box sx={sectionHeaderSx}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Language sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    letterSpacing: "0.02em",
                  }}
                >
                  Sistema
                </Typography>
              </Box>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Idioma</InputLabel>
                    <Select
                      name="idioma"
                      value={config.idioma}
                      onChange={handleChange}
                      label="Idioma"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                      <MenuItem value="en-US">English</MenuItem>
                      <MenuItem value="es-ES">Español</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Moeda</InputLabel>
                    <Select
                      name="moeda"
                      value={config.moeda}
                      onChange={handleChange}
                      label="Moeda"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="BRL">Real (R$)</MenuItem>
                      <MenuItem value="USD">Dólar (US$)</MenuItem>
                      <MenuItem value="EUR">Euro (€)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Fuso Horário</InputLabel>
                    <Select
                      name="fusoHorario"
                      value={config.fusoHorario}
                      onChange={handleChange}
                      label="Fuso Horário"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="America/Sao_Paulo">São Paulo (GMT-3)</MenuItem>
                      <MenuItem value="America/Manaus">Manaus (GMT-4)</MenuItem>
                      <MenuItem value="America/Rio_Branco">Rio Branco (GMT-5)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Itens por página"
                    name="itensPorPagina"
                    type="number"
                    value={config.itensPorPagina}
                    onChange={handleChange}
                    inputProps={{ min: 5, max: 100 }}
                    size="small"
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={cardSx}>
              <Box sx={sectionHeaderSx}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Palette sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    letterSpacing: "0.02em",
                  }}
                >
                  Aparência
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={mode === "dark"}
                    onChange={toggleTheme}
                    color="primary"
                  />
                }
                label="Modo escuro"
                sx={{ color: "text.primary", fontWeight: 500 }}
              />

              <Box sx={{ ...sectionHeaderSx, mt: 3.5 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Notifications sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    letterSpacing: "0.02em",
                  }}
                >
                  Notificações
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    name="notificacoesEmail"
                    checked={config.notificacoesEmail}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="Notificações por e-mail"
                sx={{ color: "text.primary", fontWeight: 500 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    name="notificacoesSistema"
                    checked={config.notificacoesSistema}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="Notificações do sistema"
                sx={{ color: "text.primary", fontWeight: 500, mt: 0.5, display: "block" }}
              />
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default Configuracoes;
