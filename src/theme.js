// src/theme.js
import { createTheme, alpha } from "@mui/material/styles";

const getTheme = (mode) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#3B82F6" : "#2563EB",
        light: isDark ? "#60A5FA" : "#3B82F6",
        dark: isDark ? "#1D4ED8" : "#1E40AF",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: isDark ? "#FB923C" : "#F97316",
        light: isDark ? "#FDBA74" : "#FB923C",
        dark: isDark ? "#EA580C" : "#C2410C",
        contrastText: "#FFFFFF",
      },
      background: {
        default: isDark ? "#0F172A" : "#F9FAFB",
        paper: isDark ? "#1E293B" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F1F5F9" : "#1E293B",
        secondary: isDark ? "#94A3B8" : "#64748B",
        disabled: isDark ? "#475569" : "#CBD5E1",
      },
      divider: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(0, 0, 0, 0.12)",
      action: {
        active: isDark ? "#94A3B8" : "#64748B",
        hover: isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(0, 0, 0, 0.04)",
        selected: isDark
          ? "rgba(59, 130, 246, 0.16)"
          : "rgba(37, 99, 235, 0.08)",
        disabled: isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(0, 0, 0, 0.26)",
        disabledBackground: isDark
          ? "rgba(148, 163, 184, 0.12)"
          : "rgba(0, 0, 0, 0.12)",
      },
      success: {
        main: isDark ? "#10B981" : "#059669",
        light: isDark ? "#34D399" : "#10B981",
        dark: isDark ? "#047857" : "#047857",
      },
      error: {
        main: isDark ? "#EF4444" : "#DC2626",
        light: isDark ? "#F87171" : "#EF4444",
        dark: isDark ? "#B91C1C" : "#991B1B",
      },
      warning: {
        main: isDark ? "#F59E0B" : "#D97706",
        light: isDark ? "#FBBF24" : "#F59E0B",
        dark: isDark ? "#B45309" : "#92400E",
      },
      info: {
        main: isDark ? "#3B82F6" : "#2563EB",
        light: isDark ? "#60A5FA" : "#3B82F6",
        dark: isDark ? "#1D4ED8" : "#1E40AF",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#0F172A" : "#F9FAFB",
            color: isDark ? "#F1F5F9" : "#1E293B",
            scrollbarColor: isDark ? "#475569 #1E293B" : "#CBD5E1 #F1F5F9",
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              borderRadius: 8,
              backgroundColor: isDark ? "#475569" : "#CBD5E1",
              minHeight: 24,
            },
            "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
              {
                backgroundColor: isDark ? "#64748B" : "#94A3B8",
              },
            "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: "none",
            boxShadow: isDark
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            border: isDark ? "1px solid rgba(148, 163, 184, 0.1)" : "none",
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
              ? "1px solid rgba(148, 163, 184, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.12)",
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
                  ? "rgba(148, 163, 184, 0.2)"
                  : "rgba(0, 0, 0, 0.23)",
              },
              "&:hover fieldset": {
                borderColor: isDark
                  ? "rgba(148, 163, 184, 0.3)"
                  : "rgba(0, 0, 0, 0.4)",
              },
              "&.Mui-focused fieldset": {
                borderColor: isDark ? "rgba(59, 130, 246, 0.5)" : undefined,
              },
            },
          },
        },
      },
      /** Campos com `required`: destaque (borda, fundo e label) em relação aos opcionais */
      MuiFormControl: {
        styleOverrides: {
          root: ({ theme, ownerState }) => {
            if (!ownerState.required) return {};
            const p = theme.palette.primary;
            return {
              "& .MuiOutlinedInput-root:not(.Mui-error):not(.Mui-disabled)": {
                backgroundColor: alpha(
                  p.main,
                  theme.palette.mode === "dark" ? 0.12 : 0.06,
                ),
                "& fieldset": {
                  borderColor: alpha(p.main, theme.palette.mode === "dark" ? 0.75 : 0.55),
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
              color:
                theme.palette.mode === "dark" ? p.light : p.dark,
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
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              "&:hover": { backgroundColor: "rgba(30, 41, 59, 0.8)" },
              "&.Mui-focused": { backgroundColor: "rgba(30, 41, 59, 0.9)" },
            }),
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            ...(isDark && { backgroundColor: "#1E293B" }),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark
              ? "1px solid rgba(148, 163, 184, 0.1)"
              : "1px solid rgba(224, 224, 224, 1)",
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? "rgba(148, 163, 184, 0.12)"
              : "rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
  });
};

export { getTheme };
