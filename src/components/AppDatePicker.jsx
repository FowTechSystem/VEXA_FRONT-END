// src/components/AppDatePicker.jsx
// Wrapper sobre MUI X DatePicker (pt-BR) com API compatível com input type="date":
// recebe e emite ISO string YYYY-MM-DD.
import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function AppDatePicker({
  label,
  value,
  onChange,
  size = "small",
  fullWidth = true,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  helperText,
  error,
  sx,
  slotProps,
  ...rest
}) {
  const dayjsValue = value ? dayjs(value) : null;
  const dayjsMin = minDate ? dayjs(minDate) : undefined;
  const dayjsMax = maxDate ? dayjs(maxDate) : undefined;

  return (
    <DatePicker
      label={label}
      value={dayjsValue && dayjsValue.isValid() ? dayjsValue : null}
      onChange={(newValue) => {
        if (!onChange) return;
        if (!newValue || !newValue.isValid()) {
          onChange("");
          return;
        }
        onChange(newValue.format("YYYY-MM-DD"));
      }}
      disabled={disabled}
      minDate={dayjsMin}
      maxDate={dayjsMax}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          size,
          fullWidth,
          required,
          helperText,
          error,
          sx,
          ...(slotProps?.textField || {}),
        },
        ...slotProps,
      }}
      {...rest}
    />
  );
}
