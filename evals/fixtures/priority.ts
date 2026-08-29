// Pure priority picker. No I/O, no clock. Empty input falls through to "low".
export type Level = "critical" | "high" | "normal" | "low";

export function highestPriority(levels: Level[]): Level {
  if (levels.includes("critical")) return "critical";
  if (levels.includes("high")) return "high";
  if (levels.includes("normal")) return "normal";
  return "low";
}
