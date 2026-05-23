import React from "react";
import { Box, Typography } from "@mui/material";
import { useCompanySettings } from "../contexts/CompanySettingsContext";

/**
 * Marca exibida no Header e no Sidebar. Quando há logo_url, renderiza a imagem;
 * caso contrário, mostra o display_name como texto.
 */
export default function CompanyLogo({
  variant = "text",
  height = 32,
  textProps = {},
  fallback = "VEXA",
  sx = {},
}) {
  const { settings } = useCompanySettings();
  const name = settings?.display_name?.trim() || fallback;
  const logo = settings?.logo_url;

  if (logo) {
    return (
      <Box
        component="img"
        src={logo}
        alt={name}
        sx={{
          height,
          maxHeight: height,
          width: "auto",
          display: "block",
          objectFit: "contain",
          ...sx,
        }}
      />
    );
  }

  const textSx = variant === "header"
    ? { fontWeight: 700, letterSpacing: 1, ...sx }
    : { fontWeight: 700, letterSpacing: 2, ...sx };

  return (
    <Typography
      variant={variant === "header" ? "h6" : "h5"}
      noWrap
      {...textProps}
      sx={textSx}
    >
      {name}
    </Typography>
  );
}
