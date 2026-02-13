// src/components/CriticalErrorDialog.jsx
// Modal de erro grave: centralizado, obriga o usuário a clicar em OK.
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import { EVENT_CRITICAL_ERROR } from "../utils/notifications";

export default function CriticalErrorDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCritical = (e) => {
      setMessage(e.detail?.message || "Ocorreu um erro inesperado.");
      setOpen(true);
    };
    window.addEventListener(EVENT_CRITICAL_ERROR, handleCritical);
    return () => window.removeEventListener(EVENT_CRITICAL_ERROR, handleCritical);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setMessage("");
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 320,
          maxWidth: 440,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: "error.main",
          fontWeight: 600,
        }}
      >
        <ErrorOutline fontSize="medium" />
        Erro
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ color: "text.primary" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleClose}
          sx={{ textTransform: "none", minWidth: 100 }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
