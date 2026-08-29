import { execFileSync } from "node:child_process";

// Runs `vitest run` (from the host project's install) scoped to a single produced test file.
// Returns { green, output }. Uses the host repo's own vitest config, so tests run exactly as
// the project would run them (jsdom, setup polyfills, aliases).
export function runVitest(repoRoot, relTestPath) {
  try {
    execFileSync("npx", ["vitest", "run", relTestPath], {
      cwd: repoRoot,
      stdio: "pipe",
      env: { ...process.env, TZ: "UTC" },
    });
    return { green: true, output: "" };
  } catch (e) {
    const out = `${e.stdout?.toString() ?? ""}${e.stderr?.toString() ?? ""}`;
    return { green: false, output: out };
  }
}

// Static auto-checks: every `requires` regex must match the source, no `forbids` regex may.
export function checkGreps(src, { requires = [], forbids = [] }) {
  const violations = [];
  for (const re of requires) if (!re.test(src)) violations.push(`missing required pattern ${re}`);
  for (const re of forbids) if (re.test(src)) violations.push(`contains forbidden pattern ${re}`);
  return violations;
}
