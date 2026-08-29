// MUTANT: a past date is mislabeled "expiring" instead of "expired".
export function expiryStatus(dateIso: string | null): "expired" | "expiring" | "" {
  if (!dateIso) return "";
  const when = new Date(dateIso).getTime();
  const now = Date.now();
  if (when < now) return "expiring";
  const days = (when - now) / 86_400_000;
  return days <= 30 ? "expiring" : "";
}
