// The eval cases, machine-readable. Each mirrors evals/cases/NN-*.md:
//  - fixture(s): copied into an isolated temp dir next to the produced test
//  - prompt: what the agent is asked to do (agent mode)
//  - requires / forbids: regexes the produced test MUST / MUST NOT match (the auto-checks)
// The green-run check (does `vitest run` pass?) is applied to every case in addition to these.

export const CASES = {
  "01": {
    fixture: "priority.ts",
    unit: "pure function",
    prompt: "Write a Vitest unit test for `highestPriority` in ./priority.ts. Save it as priority.test.ts in this folder. Do not modify the fixture.",
    requires: [/from\s+["']\.\/priority["']/],
    forbids: [/\.(only|skip)\s*\(/, /vi\.mock\(\s*["']\.\/priority/],
  },
  "02": {
    fixture: "expiry.ts",
    unit: "time-dependent (fake timers)",
    prompt: "Write a Vitest unit test for `expiryStatus` in ./expiry.ts. Save it as expiry.test.ts in this folder.",
    requires: [/useFakeTimers/, /setSystemTime/],
    forbids: [/\.(only|skip)\s*\(/],
  },
  "03": {
    fixtures: ["loadThings.ts", "client.ts"],
    unit: "mock the boundary",
    prompt: "Write a Vitest unit test for `loadActiveIds` in ./loadThings.ts (it imports ./client). Save it as loadThings.test.ts here.",
    requires: [/vi\.mock\(\s*["']\.\/client/],
    forbids: [/\.(only|skip)\s*\(/, /\bfetch\s*\(/, /https?:\/\//, /vi\.mock\(\s*["']\.\/loadThings/],
  },
  "04": {
    fixture: "applyFilters.ts",
    unit: "spy query-builder",
    prompt: "Write a Vitest unit test for `applyFilters` in ./applyFilters.ts. Save it as applyFilters.test.ts here.",
    requires: [/toHaveBeenCalledWith/, /not\.toHaveBeenCalled/],
    forbids: [/\.(only|skip)\s*\(/],
  },
  "05": {
    fixtures: ["handler.ts", "client.ts"],
    unit: "request handler (decode-only JWT)",
    prompt: "Write a Vitest unit test for `handle` in ./handler.ts (it imports ./client). Save it as handler.test.ts here.",
    requires: [/vi\.mock\(\s*["']\.\/client/, /base64/],
    forbids: [/\.(only|skip)\s*\(/, /jsonwebtoken|\bjose\b|\bsign\s*\(/],
  },
  "06": {
    fixture: "priority.ts",
    unit: "bootstrap-from-zero",
    prompt: "This folder has no test runner. Set up Vitest and write a unit test for ./priority.ts (priority.test.ts), then run it.",
    requires: [/from\s+["']\.\/priority["']/],
    forbids: [/\.(only|skip)\s*\(/],
    note: "Bootstrap is best judged in a bare sandbox; here the grader still verifies the produced test runs green.",
  },
  "07": {
    fixture: "priority.ts",
    unit: "verify-loop / no skips",
    prompt: "Add a unit test for ./priority.ts (priority.test.ts) and confirm it passes.",
    requires: [/from\s+["']\.\/priority["']/],
    forbids: [/\.(only|skip)\s*\(/],
  },
};
