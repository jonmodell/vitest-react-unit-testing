#!/usr/bin/env node
// Explore a file or directory and report which files are good UNIT-TEST candidates.
// Exits non-zero (with guidance) when the target has none — so the skill stops instead of
// fabricating low-value tests. Heuristic + dependency-free (regex, not a full AST).
//
//   node find-candidates.mjs <file-or-dir>
//
// Classification per file:
//   PURE   exported function(s), no JSX, no obvious I/O   -> ideal unit target
//   LOGIC  exported function(s) that touch a boundary     -> unit-testable by mocking the boundary
//   COMP   a React component (JSX / "use client")         -> use RTL or Playwright e2e, not a unit test
//   (none) no exported functions                          -> nothing to unit-test (types/config)

import fs from "node:fs";
import path from "node:path";

const IGNORE = /(^|\/)(node_modules|\.next|\.git)(\/|$)|\/main\/|\.test\.|\.spec\.|\.d\.ts$/;

const target = process.argv[2];
if (!target || !fs.existsSync(target)) {
  console.error("usage: find-candidates.mjs <file-or-dir>");
  process.exit(2);
}

function walk(p, acc = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) {
      const fp = path.join(p, e);
      if (!IGNORE.test(fp)) walk(fp, acc);
    }
  } else if (/\.(ts|tsx)$/.test(p) && !IGNORE.test(p)) {
    acc.push(p);
  }
  return acc;
}

function analyze(file) {
  const src = fs.readFileSync(file, "utf8");
  const fns = [];
  let m;
  const reFn = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g;
  const reConst = /export\s+const\s+([A-Za-z0-9_]+)\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*(?::[^=\n]*)?=>|[A-Za-z0-9_$]+\s*=>)/g;
  while ((m = reFn.exec(src))) fns.push(m[1]);
  while ((m = reConst.exec(src))) fns.push(m[1]);

  const isClient = /^\s*["']use client["']/m.test(src);
  const hasJsx = /<\/[A-Za-z]|\/>/.test(src); // closing or self-closing tag — precise vs TS generics
  const touchesBoundary = /\b(fetch|axios|createBrowserClient|createClient|supabase|fs\.(read|write)|readFile|writeFile|localStorage|Response\.json)\b/.test(src);

  let kind;
  if (isClient || hasJsx) kind = "component";
  else if (fns.length) kind = touchesBoundary ? "logic-io" : "pure";
  else kind = "none";
  return { file, kind, fns };
}

const results = walk(target).map(analyze);
const good = results.filter((r) => r.kind === "pure" || r.kind === "logic-io");
const comps = results.filter((r) => r.kind === "component");

const tag = { pure: "PURE ", "logic-io": "LOGIC", component: "COMP " };
for (const r of results) {
  if (r.kind === "none") continue;
  const rel = path.relative(process.cwd(), r.file);
  console.log(`  ${tag[r.kind]}  ${rel}  ->  ${r.fns.length ? r.fns.join(", ") : "(component)"}`);
}

if (good.length === 0) {
  console.error(`\nNo good unit-test candidates in "${target}".`);
  if (comps.length) {
    console.error(`Found ${comps.length} React component file(s) — cover those with React Testing Library`);
    console.error(`(small components) or Playwright e2e (screens/flows), not unit tests.`);
  } else {
    console.error(`No exported functions/logic were found (looks like types, config, or constants).`);
  }
  process.exit(1);
}

const pure = good.filter((r) => r.kind === "pure").length;
const logic = good.filter((r) => r.kind === "logic-io").length;
console.log(`\n${good.length} unit-test candidate file(s): ${pure} pure, ${logic} logic (mock the boundary).`);
if (comps.length) console.log(`(${comps.length} component file(s) skipped — RTL/e2e territory.)`);
