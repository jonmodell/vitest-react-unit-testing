#!/usr/bin/env node
// Eval for the skill's REQUIREMENTS GATE — proves scripts/preflight.mjs passes when the environment
// is right and FAILS (with the correct exit code + fix output) when it isn't. Deterministic and
// free: it only runs the preflight script against fixture projects in known states, so it can run
// in CI alongside the golden gate. This tests the tool itself — it is NOT one of the 01–07 cases
// and is outside the six-way case invariant.
//
//   node evals/preflight/run.mjs
//
// The "requirements met" scenario points at evals/harness/sandbox, which must have vitest installed
// (`cd evals/harness/sandbox && npm i`, or the CI step that installs it before this runs).

import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.join(__dirname, "..", "..");
const PREFLIGHT = path.join(SKILL, "scripts", "preflight.mjs");
const SANDBOX = path.join(SKILL, "evals", "harness", "sandbox");
const FIX = path.join(__dirname, "fixtures");

// Each scenario: run preflight with `args` (a --dir is appended), then assert the exit code and
// that the combined output does / does not contain each substring.
const SCENARIOS = [
  {
    name: "unit reqs met (sandbox has vitest)",
    dir: SANDBOX,
    args: [],
    exit: 0,
    includes: ["vitest", "requirements met"],
    excludes: ["requirements NOT met"],
  },
  {
    name: "component reqs unmet (react/jsdom/RTL missing)",
    dir: SANDBOX,
    args: ["--component"],
    exit: 1,
    includes: ["react / react-dom not installed", "jsdom not installed", "requirements NOT met", "i -D react react-dom"],
  },
  {
    name: "vitest missing (npm)",
    dir: path.join(FIX, "missing-vitest"),
    args: [],
    exit: 1,
    includes: ["vitest not installed", "npm i -D vitest", "requirements NOT met"],
  },
  {
    name: "vitest missing (pnpm) — package-manager detection",
    dir: path.join(FIX, "missing-vitest-pnpm"),
    args: [],
    exit: 1,
    includes: ["pnpm", "pnpm add -D vitest"],
    excludes: ["npm i -D vitest"],
  },
  {
    name: "not a Node project → exit 2",
    dir: path.join(FIX, "not-a-node-project"),
    args: [],
    exit: 2,
    includes: ["no package.json"],
  },
];

function run() {
  console.log(`\npreflight gate eval  (${SCENARIOS.length} scenarios)\n`);
  let failed = 0;
  for (const s of SCENARIOS) {
    const r = spawnSync("node", [PREFLIGHT, ...s.args, "--dir", s.dir], { encoding: "utf8" });
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    const problems = [];
    if (r.status !== s.exit) problems.push(`exit ${r.status}, expected ${s.exit}`);
    for (const inc of s.includes ?? []) if (!out.includes(inc)) problems.push(`missing "${inc}"`);
    for (const exc of s.excludes ?? []) if (out.includes(exc)) problems.push(`should not contain "${exc}"`);
    if (problems.length) {
      failed++;
      console.log(`  ✗  ${s.name}\n       ${problems.join("\n       ")}`);
    } else {
      console.log(`  ✓  ${s.name}`);
    }
  }
  console.log(`\n${failed ? `${failed} failed` : "all passed"}\n`);
  process.exit(failed ? 1 : 0);
}

if (!fs.existsSync(PREFLIGHT)) {
  console.error(`preflight script not found at ${PREFLIGHT}`);
  process.exit(2);
}
run();
