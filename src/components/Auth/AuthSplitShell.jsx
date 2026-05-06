// Login / recuperar / redefinir — layout com onda (desktop + mobile), amarelo VEXA.
import React from "react";
import { Box, Container, Typography, Paper } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { vexaColors } from "../../theme";

/** Onda vertical (bordo direito do painel amarelo, desktop) */
function WaveDividerDesktop({ fill }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 88 800"
      preserveAspectRatio="none"
      aria-hidden
      sx={{
        display: { xs: "none", md: "block" },
        position: "absolute",
        right: { md: -87 },
        top: 0,
        width: { md: 88 },
        height: "100%",
        zIndex: 2,
      }}
    >
      <path
        fill={fill}
        d="M88,0 L88,800 L12,800 C-32,600 -32,200 12,0 Z"
      />
    </Box>
  );
}

/** Onda horizontal (base do painel amarelo, mobile) */
function WaveDividerMobile({ fill }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      aria-hidden
      sx={{
        display: { xs: "block", md: "none" },
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        width: "100%",
        height: { xs: 64, sm: 72 },
        zIndex: 2,
      }}
    >
      <path
        fill={fill}
        d="M0,0 H1200 V28 Q900,92 600,56 Q300,24 0,40 Z"
      />
    </Box>
  );
}

export default function AuthSplitShell({
  title,
  subtitle,
  children,
  logoSrc = "/logo.png",
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const azul = vexaColors.azulEscuro;
  const p = theme.palette.primary;
  const waveFill = isLight ? p.main : alpha(vexaColors.cinzaAzulado, 0.35);

  const brandBackground = isLight
    ? `linear-gradient(155deg, ${alpha(p.light, 0.95)} 0%, ${p.main} 42%, ${p.dark} 100%)`
    : `linear-gradient(165deg, #1a1b28 0%, ${vexaColors.azulEscuro} 45%, #0f1018 100%)`;

  const brandTextMain = isLight ? azul : "#F4F5F8";
  const brandTextSub = isLight ? alpha(azul, 0.82) : alpha("#E8EAEF", 0.85);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        overflowY: "auto",
        bgcolor: "background.default",
      }}
    >
      {/* Painel marca — amarelo no claro; escuro elegante no dark */}
      <Box
        sx={{
          position: "relative",
          flex: { xs: "none", md: "0 0 min(430px, 42vw)" },
          minHeight: { xs: "min(40vh, 300px)", md: "100vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 2.5, sm: 3 },
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 6 },
          background: brandBackground,
          overflow: "visible",
          ...(!isLight && {
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 95% 62% at 50% -8%, ${alpha(p.main, 0.15)}, transparent 58%)`,
              pointerEvents: "none",
            },
          }),
        }}
      >
        <WaveDividerMobile fill={waveFill} />
        <WaveDividerDesktop fill={waveFill} />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <Box
            component="img"
            src={logoSrc}
            alt="VEXA"
            sx={{
              height: { xs: 96, sm: 118, md: 132 },
              width: "auto",
              maxWidth: { xs: 280, sm: 320, md: 360 },
              mb: 2,
              objectFit: "contain",
              filter: isLight
                ? `drop-shadow(0 6px 18px ${alpha(azul, 0.2)})`
                : "drop-shadow(0 10px 28px rgba(0,0,0,0.5))",
            }}
          />
          <Typography
            variant="h4"
            component="p"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.04em",
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              mb: 1,
              color: brandTextMain,
            }}
          >
            VEXA
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.55,
              fontWeight: 500,
              fontSize: { xs: "0.9rem", sm: "0.95rem" },
              px: 0.5,
              color: brandTextSub,
            }}
          >
            Sistema de Gerenciamento de Relacionamento com Cliente
          </Typography>
        </Box>
      </Box>

      {/* Formulário */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: { xs: 3, sm: 4, md: 6 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          zIndex: 1,
          minHeight: { xs: "auto", md: "100vh" },
          ml: { md: -3.5 },
          pl: { md: 4.5 },
        }}
      >
        <Container
          maxWidth="sm"
          disableGutters
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: 440 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: { xs: 3, md: 4 },
              bgcolor: "background.paper",
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
        </Container>
      </Box>
    </Box>
  );
}
