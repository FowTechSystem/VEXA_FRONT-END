import { alpha } from "@mui/material/styles";
import { vexaColors } from "../../theme";

/** Campos “pill” nas telas de auth (evita fundo amarelo do tema em `required`). */
export function authPillTextFieldSx(theme, isLight) {
  const azul = vexaColors.azulEscuro;
  return {
    "& .MuiOutlinedInput-root": {
      borderRadius: 999,
      backgroundColor: isLight ? alpha(azul, 0.04) : alpha("#ffffff", 0.035),
      "& fieldset": {
        borderColor: isLight ? alpha(azul, 0.12) : alpha("#ffffff", 0.14),
      },
      "&:hover fieldset": {
        borderColor: isLight ? alpha(azul, 0.22) : alpha("#ffffff", 0.26),
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
  };
}
