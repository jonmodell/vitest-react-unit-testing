// MUTANT: empty/no-match falls through to `normal` instead of `low`.
export type Level = "critical" | "high" | "normal" | "low";

export function highestPriority(levels: Level[]): Level {
  if (levels.includes("critical")) return "critical";
  if (levels.includes("high")) return "high";
  if (levels.includes("normal")) return "normal";
  return "normal";
}
