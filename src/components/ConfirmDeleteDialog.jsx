// src/components/ConfirmDeleteDialog.jsx
// Dialog reutilizável de confirmação de exclusão, padronizado para todo o sistema.
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title = "Excluir registro",
  message = "Deseja realmente excluir este registro?",
  itemLabel,
  loading = false,
  confirmText = "Excluir",
  cancelText = "Cancelar",
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-delete-title"
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 380,
          maxWidth: 440,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle id="confirm-delete-title" sx={{ fontWeight: 600, color: "text.primary", pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px", lineHeight: 1.6 }}>
          {message}
        </Typography>
        {itemLabel ? (
          <Typography
            variant="subtitle2"
            sx={{ mt: 2, fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}
          >
            {itemLabel}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
        <Button
          type="button"
          onClick={onClose}
          disabled={loading}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          sx={{ textTransform: "none", minWidth: 100 }}
        >
          {loading ? "Excluindo…" : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
