// src/theme.js — paleta institucional VEXA
import { createTheme, alpha } from "@mui/material/styles";

/** Cores oficiais (tabela VEXA) */
export const vexaColors = {
  azulEscuro: "#2B2D42",
  cinzaAzulado: "#8D99AE",
  preto: "#000000",
  amareloNeon: "#F8F32B",
};

/**
 * Modo escuro “profundo” — fundo mais escuro que o azul institucional (#2B2D42),
 * com papel elevado discretamente mais claro para hierarquia visual.
 */
export const vexaSurfaces = {
  /** Tela base (main, body, canvas) */
  darkCanvas: "#12131c",
  /** Sidebar, cards, AppBar, inputs — superfície elevada */
  darkPaper: "#1c1e2c",
  /**
   * Modo claro suave — evita branco puro (#FFF) e cinza muito seco (#F0F1F5).
   * Canvas mais frio; papel “off-white” para cartões e chrome.
   */
  lightCanvas: "#E6E9F0",
  lightPaper: "#F0F2F7",
};

const getTheme = (mode) => {
  const isDark = mode === "dark";
  const v = vexaColors;
  const canvasDark = vexaSurfaces.darkCanvas;
  const paperDark = vexaSurfaces.darkPaper;
  const canvasLight = vexaSurfaces.lightCanvas;
  const paperLight = vexaSurfaces.lightPaper;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: v.amareloNeon,
        light: "#FAF45A",
        dark: "#C9C425",
        contrastText: v.preto,
      },
      secondary: {
        main: v.cinzaAzulado,
        light: "#A8B2C3",
        dark: "#6F7A8C",
        contrastText: isDark ? "#FFFFFF" : v.preto,
      },
      background: {
        default: isDark ? canvasDark : canvasLight,
        paper: isDark ? paperDark : paperLight,
      },
      text: {
        primary: isDark ? "#ECEEF4" : v.azulEscuro,
        secondary: isDark ? alpha(v.cinzaAzulado, 0.92) : alpha(v.azulEscuro, 0.72),
        disabled: isDark ? alpha(v.cinzaAzulado, 0.45) : alpha(v.azulEscuro, 0.38),
      },
      divider: isDark ? alpha(v.cinzaAzulado, 0.22) : alpha(v.azulEscuro, 0.09),
      action: {
        active: isDark ? v.cinzaAzulado : alpha(v.azulEscuro, 0.65),
        hover: isDark ? alpha(v.cinzaAzulado, 0.12) : alpha(v.preto, 0.05),
        selected: isDark ? alpha(v.amareloNeon, 0.12) : alpha(v.amareloNeon, 0.24),
        disabled: isDark ? alpha(v.cinzaAzulado, 0.35) : alpha(v.preto, 0.26),
        disabledBackground: isDark
          ? alpha(v.cinzaAzulado, 0.12)
          : alpha(v.preto, 0.08),
      },
      success: {
        main: isDark ? "#34D399" : "#059669",
        light: isDark ? "#6EE7B7" : "#10B981",
        dark: isDark ? "#059669" : "#047857",
      },
      error: {
        main: isDark ? "#F87171" : "#DC2626",
        light: isDark ? "#FCA5A5" : "#EF4444",
        dark: isDark ? "#B91C1C" : "#991B1B",
      },
      warning: {
        main: isDark ? "#FBBF24" : "#D97706",
        light: isDark ? "#FCD34D" : "#F59E0B",
        dark: isDark ? "#B45309" : "#92400E",
      },
      info: {
        main: isDark ? v.cinzaAzulado : v.azulEscuro,
        light: isDark ? "#A8B2C3" : v.cinzaAzulado,
        dark: isDark ? "#6F7A8C" : v.preto,
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? canvasDark : canvasLight,
            color: isDark ? "#ECEEF4" : v.azulEscuro,
            scrollbarColor: isDark
              ? `${alpha(v.cinzaAzulado, 0.5)} ${canvasDark}`
              : `${alpha(v.cinzaAzulado, 0.75)} ${alpha(v.azulEscuro, 0.06)}`,
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              borderRadius: 8,
              backgroundColor: isDark
                ? alpha(v.cinzaAzulado, 0.45)
                : alpha(v.cinzaAzulado, 0.65),
              minHeight: 24,
            },
            "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
              {
                backgroundColor: isDark
                  ? alpha(v.cinzaAzulado, 0.7)
                  : alpha(v.azulEscuro, 0.35),
              },
            "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
              backgroundColor: isDark ? canvasDark : alpha(v.azulEscuro, 0.05),
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
            ...(t.palette.mode === "light"
              ? {
                  "&.MuiButton-outlinedPrimary": {
                    color: t.palette.text.primary,
                    borderColor: alpha(t.palette.primary.main, 0.75),
                    "&:hover": {
                      borderColor: t.palette.primary.dark,
                      backgroundColor: alpha(t.palette.primary.main, 0.1),
                      color: t.palette.text.primary,
                    },
                  },
                }
              : {}),
          }),
        },
      },
      MuiTab: {
        styleOverrides: {
          root: ({ theme: t }) =>
            t.palette.mode === "light"
              ? {
                  "&.Mui-selected": {
                    color: `${t.palette.text.primary} !important`,
                    fontWeight: 700,
                  },
                }
              : {},
        },
      },
      MuiChip: {
        styleOverrides: {
          root: ({ theme: t }) =>
            t.palette.mode === "light"
              ? {
                  "&.MuiChip-filled.MuiChip-colorSuccess": {
                    backgroundColor: t.palette.success.dark,
                    color: "#ffffff",
                    fontWeight: 600,
                  },
                  "&.MuiChip-filled.MuiChip-colorError": {
                    backgroundColor: t.palette.error.dark,
                    color: "#ffffff",
                    fontWeight: 600,
                  },
                }
              : {},
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: "none",
            boxShadow: isDark
              ? "0 4px 14px -2px rgba(0, 0, 0, 0.55), 0 2px 6px -2px rgba(0, 0, 0, 0.4)"
              : "0 1px 3px 0 rgba(43, 45, 66, 0.08), 0 1px 2px 0 rgba(43, 45, 66, 0.06)",
            border: isDark
              ? `1px solid ${alpha(v.cinzaAzulado, 0.16)}`
              : `1px solid ${alpha(v.azulEscuro, 0.12)}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            borderRight: isDark
              ? `1px solid ${alpha(v.cinzaAzulado, 0.18)}`
              : `1px solid ${alpha(v.azulEscuro, 0.1)}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: isDark
                  ? alpha(v.cinzaAzulado, 0.35)
                  : alpha(v.azulEscuro, 0.22),
              },
              "&:hover fieldset": {
                borderColor: isDark
                  ? alpha(v.cinzaAzulado, 0.55)
                  : alpha(v.azulEscuro, 0.35),
              },
              "&.Mui-focused fieldset": {
                borderColor: isDark
                  ? alpha(v.amareloNeon, 0.75)
                  : v.amareloNeon,
              },
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: ({ theme, ownerState }) => {
            if (!ownerState.required) return {};
            const p = theme.palette.primary;
            return {
              "& .MuiOutlinedInput-root:not(.Mui-error):not(.Mui-disabled)": {
                backgroundColor: alpha(
                  p.main,
                  theme.palette.mode === "dark" ? 0.14 : 0.12,
                ),
                "& fieldset": {
                  borderColor: alpha(
                    p.main,
                    theme.palette.mode === "dark" ? 0.85 : 0.65,
                  ),
                  borderWidth: 2,
                },
                "&:hover fieldset": {
                  borderColor: p.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: p.main,
                  borderWidth: 2,
                },
              },
            };
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme, ownerState }) => {
            if (!ownerState.required) return {};
            const p = theme.palette.primary;
            return {
              fontWeight: 600,
              color: theme.palette.mode === "dark" ? p.light : p.dark,
              "&.Mui-focused": {
                color: p.main,
              },
              "& .MuiInputLabel-asterisk": {
                color: p.main,
              },
            };
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            ...(isDark && {
              backgroundColor: alpha(paperDark, 0.55),
              "&:hover": { backgroundColor: alpha(paperDark, 0.85) },
              "&.Mui-focused": { backgroundColor: alpha(paperDark, 1) },
            }),
            ...(!isDark && {
              backgroundColor: alpha("#ffffff", 0.45),
              "&:hover": { backgroundColor: alpha("#ffffff", 0.72) },
              "&.Mui-focused": { backgroundColor: alpha("#ffffff", 0.92) },
            }),
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            ...(isDark && { backgroundColor: paperDark }),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark
              ? `1px solid ${alpha(v.cinzaAzulado, 0.14)}`
              : `1px solid ${alpha(v.azulEscuro, 0.1)}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? alpha(v.cinzaAzulado, 0.18)
              : alpha(v.azulEscuro, 0.1),
          },
        },
      },
    },
  });
};

export { getTheme };
