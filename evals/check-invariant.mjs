#!/usr/bin/env node
// Self-guard for the SIX-way case invariant (see CLAUDE.md). Every eval case NN must appear, in sync,
// in all of: evals/cases/NN-*.md · evals/harness/cases.mjs (the CASES key) · evals/golden/NN.test.ts ·
// evals/fixtures/ (each fixture the case names) · evals/mutants/NN/ (>=1 mutant that replaces a real
// fixture). This script asserts that on-disk shape and FAILS CI on any drift or orphan — so the docs/
// eval rot we fix by hand cannot silently return. Deterministic, dependency-free, free to run.
//
//   node evals/check-invariant.mjs
//
// Exit 0 = every case is complete and there are no orphans; 1 = a problem (printed per case).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASES } from "./harness/cases.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CASES_DIR = path.join(__dirname, "cases");
const GOLDEN_DIR = path.join(__dirname, "golden");
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const MUTANTS_DIR = path.join(__dirname, "mutants");

const fixturesFor = (c) => c.fixtures ?? [c.fixture]; // mirrors run.mjs
const ids = Object.keys(CASES);
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const ls = (p) => (fs.existsSync(p) ? fs.readdirSync(p) : []);

// Per-case forward checks: every artifact the case declares must exist and line up.
function checkCase(id) {
  const c = CASES[id];
  const problems = [];

  const md = ls(CASES_DIR).filter((f) => new RegExp(`^${id}-.*\\.md$`).test(f));
  if (md.length === 0) problems.push(`no evals/cases/${id}-*.md`);
  else if (md.length > 1) problems.push(`multiple case docs for ${id}: ${md.join(", ")}`);

  if (!fs.existsSync(path.join(GOLDEN_DIR, `${id}.test.ts`))) problems.push(`no evals/golden/${id}.test.ts`);

  const fixtures = fixturesFor(c);
  for (const f of fixtures) {
    if (!fs.existsSync(path.join(FIXTURES_DIR, f))) problems.push(`fixture missing: evals/fixtures/${f}`);
  }

  const mDir = path.join(MUTANTS_DIR, id);
  if (!isDir(mDir)) {
    problems.push(`no evals/mutants/${id}/ (each case needs >=1 mutant)`);
  } else {
    const subdirs = ls(mDir).filter((d) => isDir(path.join(mDir, d)));
    if (subdirs.length === 0) problems.push(`evals/mutants/${id}/ has no mutant subdirs`);
    for (const d of subdirs) {
      const tsFiles = ls(path.join(mDir, d)).filter((f) => /\.tsx?$/.test(f));
      if (tsFiles.length === 0) {
        problems.push(`mutant ${id}/${d} has no .ts file`);
        continue;
      }
      // Every mutant file must overwrite a fixture the case actually uses, or checkMutants is a no-op.
      const stray = tsFiles.filter((f) => !fixtures.includes(f));
      if (stray.length) problems.push(`mutant ${id}/${d} replaces non-fixture file(s): ${stray.join(", ")} (case fixtures: ${fixtures.join(", ")})`);
    }
  }
  return problems;
}

// Reverse checks: no artifact for a case id that has no CASES entry (a stray golden/mutant/doc).
function checkOrphans() {
  const problems = [];
  const has = (id) => ids.includes(id);

  for (const f of ls(GOLDEN_DIR)) {
    const m = f.match(/^(\d+)\.test\.ts$/);
    if (m && !has(m[1])) problems.push(`orphan golden with no case: evals/golden/${f}`);
  }
  for (const d of ls(MUTANTS_DIR)) {
    if (isDir(path.join(MUTANTS_DIR, d)) && /^\d+$/.test(d) && !has(d)) problems.push(`orphan mutants dir with no case: evals/mutants/${d}/`);
  }
  for (const f of ls(CASES_DIR)) {
    const m = f.match(/^(\d+)-.*\.md$/);
    if (m && !has(m[1])) problems.push(`orphan case doc with no CASES entry: evals/cases/${f}`);
  }
  return problems;
}

console.log(`\ncase invariant — ${ids.length} cases\n`);
let failed = 0;
for (const id of ids) {
  const problems = checkCase(id);
  if (problems.length) {
    failed++;
    console.log(`  ✗  ${id}\n       ${problems.join("\n       ")}`);
  } else {
    console.log(`  ✓  ${id}  ${CASES[id].unit}`);
  }
}
const orphans = checkOrphans();
if (orphans.length) {
  failed++;
  console.log(`  ✗  orphans\n       ${orphans.join("\n       ")}`);
}

console.log(`\n${failed ? `${failed} problem group(s) — the six-way invariant has drifted (see CLAUDE.md).` : "invariant intact — all six artifacts in sync for every case."}\n`);
process.exit(failed ? 1 : 0);
