// MUTANT: precedence broken — `critical` no longer wins over `high`.
export type Level = "critical" | "high" | "normal" | "low";

export function highestPriority(levels: Level[]): Level {
  if (levels.includes("high")) return "high";
  if (levels.includes("critical")) return "critical";
  if (levels.includes("normal")) return "normal";
  return "low";
}
