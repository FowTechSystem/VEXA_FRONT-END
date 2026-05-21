/** Extrai mensagem legível do corpo de erro da API (ASP.NET ProblemDetails, etc.). */
export function getApiErrorMessage(err, fallback = "Operação não concluída.") {
  const d = err?.response?.data;
  if (!d) return err?.message || fallback;
  if (typeof d === "string" && d.trim()) return d.trim();
  const msg =
    d.message ?? d.Message ?? d.mensagem ?? d.Mensagem ?? d.title ?? d.Title;
  if (msg != null && String(msg).trim()) return String(msg).trim();
  if (Array.isArray(d.errors)) {
    return d.errors
      .map((e) => (typeof e === "string" ? e : e?.message ?? e?.Message))
      .filter(Boolean)
      .join(", ");
  }
  if (d.errors && typeof d.errors === "object") {
    return Object.values(d.errors)
      .flat()
      .map((e) => (typeof e === "string" ? e : e?.message))
      .filter(Boolean)
      .join(", ");
  }
  return err?.message || fallback;
}
