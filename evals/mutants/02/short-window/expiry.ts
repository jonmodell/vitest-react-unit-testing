// MUTANT: "expiring" window shrunk from 30 days to 7 — a ~10-day-out date reads as "".
export function expiryStatus(dateIso: string | null): "expired" | "expiring" | "" {
  if (!dateIso) return "";
  const when = new Date(dateIso).getTime();
  const now = Date.now();
  if (when < now) return "expired";
  const days = (when - now) / 86_400_000;
  return days <= 7 ? "expiring" : "";
}
