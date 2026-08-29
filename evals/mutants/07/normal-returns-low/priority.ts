// MUTANT: the `normal` branch is broken — a list whose top level is `normal` reads as `low`.
export type Level = "critical" | "high" | "normal" | "low";

export function highestPriority(levels: Level[]): Level {
  if (levels.includes("critical")) return "critical";
  if (levels.includes("high")) return "high";
  if (levels.includes("normal")) return "low";
  return "low";
}
