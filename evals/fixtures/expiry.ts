// Time-dependent: classifies a date relative to NOW. Must be tested with fake timers.
export function expiryStatus(dateIso: string | null): "expired" | "expiring" | "" {
  if (!dateIso) return "";
  const when = new Date(dateIso).getTime();
  const now = Date.now();
  if (when < now) return "expired";
  const days = (when - now) / 86_400_000;
  return days <= 30 ? "expiring" : "";
}
