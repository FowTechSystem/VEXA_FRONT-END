// Layout em duas colunas (marca + formulário) — Login, recuperar e redefinir senha.
import React from "react";
import { Box, Container, Typography } from "@mui/material";

export default function AuthSplitShell({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          background: "linear-gradient(135deg, #2B2D42 0%, #000000 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#E8EAEF",
          p: 4,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="VEXA"
          sx={{ height: 120, mb: 3, objectFit: "contain" }}
        />
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
          VEXA
        </Typography>
        <Typography
          variant="h6"
          sx={{ opacity: 0.9, textAlign: "center", maxWidth: 500 }}
        >
          Sistema de Gerenciamento de Relacionamento com Cliente
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "background.paper",
          p: 4,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 1, color: "primary.main" }}
            >
              {title}
            </Typography>
            {subtitle != null && subtitle !== "" && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
