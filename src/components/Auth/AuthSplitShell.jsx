import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { vexaColors, vexaSurfaces } from "../../theme";

export default function AuthSplitShell({ title, subtitle, children, logoSrc = "/logo.png" }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const azul = vexaColors.azulEscuro;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, md: 6 },
        pt: { xs: "10vh", sm: "12vh", md: "14vh" },
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        background: isLight
          ? "linear-gradient(135deg, #e9ecf4 0%, #e4e8f1 52%, #eef1f7 100%)"
          : `linear-gradient(130deg, ${vexaSurfaces.darkCanvas} 0%, ${alpha(azul, 0.42)} 42%, #0a0b12 100%)`,
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(141,153,174,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(141,153,174,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: isLight ? 0.2 : 0.5,
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Box
        sx={{
          zIndex: 1,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src={logoSrc}
          alt="VEXA Sistemas"
          sx={{
            height: { xs: 230, sm: 300, md: 340 },
            width: "auto",
            maxWidth: { xs: "min(94vw, 460px)", sm: 560, md: 620 },
            mb: { xs: -2.5, sm: -3.5, md: -4 },
            display: "block",
            objectFit: "contain",
            filter: "none",
          }}
        />

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 440,
            mt: { xs: -1.5, sm: -2 },
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: { xs: 3, md: 4 },
            bgcolor: "background.paper",
            textAlign: "left",
            ...(isLight
              ? {
                  border: `1px solid ${alpha(azul, 0.08)}`,
                  boxShadow: `0 4px 24px ${alpha(azul, 0.08)}, 0 2px 8px ${alpha("#000", 0.04)}`,
                }
              : {
                  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                  boxShadow: `0 16px 48px ${alpha("#000", 0.4)}`,
                }),
          }}
        >
          <Box sx={{ mb: 2.5 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                bgcolor: "primary.main",
                mb: 1.5,
              }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 0.75,
                color: "text.primary",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </Typography>
            {subtitle != null && subtitle !== "" && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
