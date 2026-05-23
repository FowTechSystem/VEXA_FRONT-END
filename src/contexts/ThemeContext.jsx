// src/contexts/ThemeContext.jsx
import React, { createContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "../theme";
import { useCompanySettings } from "./CompanySettingsContext";

const ThemeContext = createContext();

const STORAGE_KEY = "themeMode";
const USER_OVERRIDE_KEY = "themeModeUserOverride";

export const ThemeProvider = ({ children }) => {
  const { settings } = useCompanySettings();

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || "dark";
  });
  const [userOverride, setUserOverride] = useState(
    () => localStorage.getItem(USER_OVERRIDE_KEY) === "1",
  );

  // Se o usuário ainda não trocou manualmente, segue o tema padrão da empresa.
  useEffect(() => {
    if (userOverride) return;
    if (!settings?.default_theme) return;
    const next = settings.default_theme === "light" ? "light" : "dark";
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [settings?.default_theme, userOverride]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(USER_OVERRIDE_KEY, "1");
      return next;
    });
    setUserOverride(true);
  };

  const theme = useMemo(
    () =>
      getTheme(mode, {
        primaryColor: settings?.primary_color,
        secondaryColor: settings?.secondary_color,
      }),
    [mode, settings?.primary_color, settings?.secondary_color],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
