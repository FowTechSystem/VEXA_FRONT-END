// src/components/VexaDatePicker.jsx
// DatePicker padrão do VEXA — segue o tema (dark/light) automaticamente
// e expõe o valor como string ISO "YYYY-MM-DD" (compatível com a forma
// como o sistema já trabalha com datas, mantendo as APIs do backend intactas).
//
// Uso:
//   <VexaDatePicker label="Data início" value={dataInicio} onChange={setDataInicio} />
//
// Equivale a um <TextField type="date" /> mas com:
//   • Calendário próprio (não usa o nativo do browser)
//   • Visual idêntico em qualquer SO
//   • Respeita o tema (cores, foco amarelo, paper escuro)
//   • Formato apresentado em pt-BR: DD/MM/AAAA
import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

/**
 * @param {object}   props
 * @param {string}   props.value     — string "YYYY-MM-DD" ou "" para vazio
 * @param {Function} props.onChange  — recebe a nova string "YYYY-MM-DD" ("" se limpo)
 * @param {string}   [props.label]
 * @param {object}   [props.sx]      — sx adicional aplicado ao TextField interno
 * @param {boolean}  [props.fullWidth]
 * @param {number}   [props.minWidth=170]
 * @param {boolean}  [props.disabled]
 * @param {string}   [props.minDate] — "YYYY-MM-DD" inclusive
 * @param {string}   [props.maxDate] — "YYYY-MM-DD" inclusive
 * @param {object}   [props.slotProps] — slots/props adicionais (mescla com defaults)
 */
export function VexaDatePicker({
  value,
  onChange,
  label,
  sx,
  fullWidth,
  minWidth = 170,
  disabled,
  minDate,
  maxDate,
  slotProps,
  ...rest
}) {
  const handleChange = (d) => {
    if (!d || !d.isValid?.()) {
      onChange?.("");
      return;
    }
    onChange?.(d.format("YYYY-MM-DD"));
  };

  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      format="DD/MM/YYYY"
      disabled={disabled}
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
      slotProps={{
        textField: {
          size: "small",
          fullWidth,
          InputLabelProps: { shrink: true },
          sx: { minWidth, ...sx },
          ...(slotProps?.textField || {}),
        },
        // Demais slots (popper, etc) ficam com defaults do tema VEXA
        ...slotProps,
      }}
      {...rest}
    />
  );
}

export default VexaDatePicker;
