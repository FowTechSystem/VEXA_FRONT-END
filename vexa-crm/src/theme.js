// src/theme.js
import { createTheme } from "@mui/material/styles";

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#7C3AED", // Roxo vibrante
        light: "#A78BFA",
        dark: "#5B21B6",
      },
      secondary: {
        main: "#F97316", // Laranja marcante
        light: "#FB923C",
        dark: "#EA580C",
      },
      background: {
        default: mode === "dark" ? "#121212" : "#F9FAFB",
        paper: mode === "dark" ? "#1E1E1E" : "#FFFFFF",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              mode === "dark"
                ? "0 2px 8px rgba(255,255,255,0.1)"
                : "0 2px 8px rgba(0,0,0,0.1)",
          },
        },
      },
    },
  });

export { getTheme };
