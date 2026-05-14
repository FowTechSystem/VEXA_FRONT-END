/**
 * Rótulo relativo para notificações (atualiza conforme o relógio avança).
 * @param {string | null | undefined} iso - Data ISO 8601 do evento
 * @returns {string}
 */
export function formatRelativeTimeLabel(iso) {
  if (!iso) return "Agora";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Agora";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Agora";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  return d.toLocaleDateString("pt-BR");
}
