// src/components/Bazar/NovoConsignanteModal.jsx
// Modal de cadastro/edição de consignante.
//   - Sem `existing` → cria via POST /bazar/consignantes
//   - Com `existing` → atualiza via PUT /bazar/consignantes/:id
// Em ambos os casos retorna o consignante salvo para o componente pai
// através de onSaved (que pode redirecionar / recarregar a lista).
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Close, Handshake, Edit as EditIcon } from "@mui/icons-material";
import { bazarConsignantesService } from "../../api/bazarConsignantesService";
import { showError } from "../../utils/notifications";

const emptyState = {
  nome: "",
  telefone: "",
  cpf: "",
  observacao: "",
};

const maskTelefone = (raw) => {
  const v = raw.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  }
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
};

const maskCPF = (raw) => {
  const v = raw.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
};

function NovoConsignanteModal({ open, onClose, onSaved, existing = null }) {
  const isEdit = !!existing;
  const [form, setForm] = useState(emptyState);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setForm({
        nome: existing.nome || "",
        telefone: existing.telefone || "",
        cpf: existing.cpf || "",
        observacao: existing.observacao || "",
      });
    } else {
      setForm(emptyState);
    }
    setErros({});
  }, [open, existing]);

  const handleChange = (campo) => (e) => {
    let val = e.target.value;
    if (campo === "telefone") val = maskTelefone(val);
    if (campo === "cpf") val = maskCPF(val);
    setForm((prev) => ({ ...prev, [campo]: val }));
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    const telDigits = form.telefone.replace(/\D/g, "");
    if (telDigits.length < 10) e.telefone = "Informe um telefone válido";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = async () => {
    if (!validar() || salvando) return;
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone,
        cpf: form.cpf,
        observacao: form.observacao,
      };
      const saved = isEdit
        ? await bazarConsignantesService.update(existing.id, payload)
        : await bazarConsignantesService.create(payload);
      onSaved?.(saved);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (isEdit
          ? "Não foi possível atualizar o consignante."
          : "Não foi possível cadastrar o consignante.");
      showError(msg);
      console.error("[NovoConsignanteModal] erro ao salvar:", error);
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
        sx: {
          borderRadius: 3,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, pr: 6 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isEdit ? <EditIcon fontSize="small" /> : <Handshake fontSize="small" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {isEdit ? "Editar consignante" : "Novo consignante"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isEdit
              ? "Atualize os dados do consignante"
              : "Cadastro rápido para começar a registrar peças"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={salvando} sx={{ ml: 1 }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              autoFocus
              label="Nome"
              value={form.nome}
              onChange={handleChange("nome")}
              error={!!erros.nome}
              helperText={erros.nome || ""}
              size="small"
              placeholder="Nome completo do consignante"
              disabled={salvando}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Telefone"
              value={form.telefone}
              onChange={handleChange("telefone")}
              error={!!erros.telefone}
              helperText={erros.telefone || ""}
              size="small"
              placeholder="(11) 91234-5678"
              inputProps={{ inputMode: "tel" }}
              disabled={salvando}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CPF"
              value={form.cpf}
              onChange={handleChange("cpf")}
              size="small"
              placeholder="000.000.000-00"
              inputProps={{ inputMode: "numeric" }}
              disabled={salvando}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observação"
              value={form.observacao}
              onChange={handleChange("observacao")}
              size="small"
              multiline
              rows={3}
              placeholder="Anotações internas (opcional)"
              disabled={salvando}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={salvando}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSalvar}
          variant="contained"
          disabled={salvando}
          startIcon={salvando ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ textTransform: "none", px: 4, fontWeight: 700 }}
        >
          {isEdit ? "Salvar alterações" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NovoConsignanteModal;
