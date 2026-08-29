import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

// Mutation check — the other half of grading. A test that runs green proves it PASSES on correct
// code; this proves it FAILS on broken code (rubric R2, mechanized). For each mutant of a case we
// swap the buggy fixture into the case dir, re-run the produced test, and require it to go RED.
// A mutant that leaves the test green "survived" — the test never actually asserted that behavior.
//
//   mutantsDir/<caseId>/<mutant-name>/<fixtureFile>   # one dir per mutant; files overwrite fixtures
//   first line `// MUTANT: <desc>`                     # used as the survivor's label in the report
//
// Returns the list of survivors (empty = the test caught every mutant).
export function checkMutants(mutantsDir, caseId, repoRoot, caseDir, relTestPath) {
  const base = path.join(mutantsDir, caseId);
  if (!fs.existsSync(base)) return [];
  const survivors = [];
  for (const name of fs.readdirSync(base)) {
    const mDir = path.join(base, name);
    if (!fs.statSync(mDir).isDirectory()) continue;
    const files = fs.readdirSync(mDir).filter((f) => /\.tsx?$/.test(f));
    const backups = files.map((f) => {
      const target = path.join(caseDir, f);
      const prior = fs.existsSync(target) ? fs.readFileSync(target) : null;
      fs.copyFileSync(path.join(mDir, f), target);
      return [target, prior];
    });
    const { green } = runVitest(repoRoot, relTestPath); // fresh vitest process → no stale module cache
    for (const [target, prior] of backups) {
      if (prior === null) fs.rmSync(target, { force: true });
      else fs.writeFileSync(target, prior);
    }
    if (green) survivors.push(describeMutant(path.join(mDir, files[0]), `${caseId}/${name}`));
  }
  return survivors;
}

function describeMutant(file, fallback) {
  const first = fs.readFileSync(file, "utf8").split("\n", 1)[0];
  const m = first.match(/^\/\/\s*MUTANT:\s*(.+)$/);
  return m ? `${fallback} — ${m[1].trim()}` : fallback;
}
