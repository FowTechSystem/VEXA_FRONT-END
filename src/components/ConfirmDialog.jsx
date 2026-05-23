// src/components/ConfirmDialog.jsx
// Modal de confirmação reutilizável para o VEXA, com 3 variantes:
//
//   variant="confirm"  → confirmação padrão (Cancelar / Confirmar)
//   variant="warning"  → confirmação com aviso amarelo (Cancelar / Confirmar)
//   variant="blocking" → aviso bloqueante, sem opção de prosseguir (apenas Entendi)
//
// Uso:
//   <ConfirmDialog
//     open
//     variant="confirm"
//     destructive
//     title="Deseja excluir esta peça?"
//     message="Esta ação não pode ser desfeita."
//     confirmLabel="Excluir"
//     onConfirm={...}
//     onClose={...}
//     loading={isDeleting}
//   />
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Close,
  WarningAmberRounded,
  ErrorOutline,
  HelpOutline,
} from "@mui/icons-material";

const VARIANT_STYLE = {
  confirm: {
    cor: (theme) => theme.palette.primary.main,
    Icone: HelpOutline,
  },
  warning: {
    cor: (theme) => theme.palette.warning.main,
    Icone: WarningAmberRounded,
  },
  blocking: {
    cor: (theme) => theme.palette.error.main,
    Icone: ErrorOutline,
  },
};

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  variant = "confirm",
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  acknowledgeLabel = "Entendi",
  destructive = false,
  loading = false,
  maxWidth = "xs",
}) {
  const theme = useTheme();
  const { cor: corFn, Icone } = VARIANT_STYLE[variant] || VARIANT_STYLE.confirm;
  const cor = corFn(theme);
  const isBlocking = variant === "blocking";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
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
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
          pr: 6,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: alpha(cor, 0.18),
            color: cor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1px solid ${alpha(cor, 0.4)}`,
          }}
        >
          <Icone />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", flex: 1, minWidth: 0 }}>
          {title}
        </Typography>
        {!isBlocking && (
          <IconButton
            onClick={onClose}
            size="small"
            disabled={loading}
            aria-label="Fechar"
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        {typeof message === "string" ? (
          <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-line" }}>
            {message}
          </Typography>
        ) : (
          message
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {isBlocking ? (
          <Button
            onClick={onClose}
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 700, px: 4 }}
          >
            {acknowledgeLabel}
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              disabled={loading}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              variant="contained"
              color={destructive ? "error" : "primary"}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : null
              }
              sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
            >
              {confirmLabel}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
