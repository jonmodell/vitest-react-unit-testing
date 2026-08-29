#!/usr/bin/env node
// Verify a project meets the requirements for Vitest unit/component tests BEFORE writing any.
// Dependency-free. Reads the project's package.json + installed node_modules + Node version.
//
//   node preflight.mjs [--component] [--dir <projectRoot>]
//
//   (default)      check the baseline every unit test needs (Node, a package manager, vitest).
//   --component    ALSO check the React + jsdom + RTL stack a component test needs.
//
// Prints one line per check (✓ ok / ! warn / ✗ missing). For every ✗ it prints a copy-pasteable
// fix using the project's own package manager. Exit 0 = all hard requirements met (warnings are
// fine); 1 = a hard requirement is missing (STOP and give the user the printed fixes); 2 = usage.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const wantComponent = args.includes("--component");
const dirFlag = args.indexOf("--dir");
const root = path.resolve(dirFlag >= 0 ? args[dirFlag + 1] ?? "." : ".");

const pkgPath = path.join(root, "package.json");
if (!fs.existsSync(pkgPath)) {
  console.error(`✗  no package.json in ${root} — not a Node project. Run this from the project root, or --dir <path>.`);
  process.exit(2);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const declared = { ...pkg.devDependencies, ...pkg.dependencies };

// Installed version wins over the declared range (ranges lie about what's actually there).
function installed(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8")).version;
  } catch {
    return null;
  }
}
const present = (name) => installed(name) ?? (declared[name] ? `declared ${declared[name]} (not installed — run install)` : null);
const majorOf = (v) => (v ? parseInt(String(v).replace(/^\D*/, ""), 10) : NaN);
const minorOf = (v) => { const m = String(v).replace(/^\D*/, "").split("."); return [parseInt(m[0], 10), parseInt(m[1] ?? "0", 10)]; };

// Package manager → its dev-install command (for the printed fixes).
const pm = fs.existsSync(path.join(root, "pnpm-lock.yaml")) ? "pnpm"
  : fs.existsSync(path.join(root, "yarn.lock")) ? "yarn"
  : fs.existsSync(path.join(root, "bun.lockb")) ? "bun"
  : "npm";
const install = (pkgs) => ({ npm: `npm i -D ${pkgs}`, pnpm: `pnpm add -D ${pkgs}`, yarn: `yarn add -D ${pkgs}`, bun: `bun add -d ${pkgs}` }[pm]);

const fixes = [];
let hardFail = false;
const ok = (m) => console.log(`  ✓  ${m}`);
const warn = (m) => console.log(`  !  ${m}`);
const miss = (m, fix) => { console.log(`  ✗  ${m}`); if (fix) fixes.push(fix); hardFail = true; };

console.log(`\npreflight — ${path.relative(process.cwd(), root) || "."}  (${pm}, ${wantComponent ? "component" : "unit"} mode)\n`);

// --- baseline (every unit test needs these) ---
const nodeMajor = majorOf(process.version);
if (nodeMajor >= 18) ok(`Node ${process.version} (≥18)`);
else miss(`Node ${process.version} is below 18 — Vitest 2 needs Node ≥18`, `Install Node 18/20/22 LTS (nvm install 20 && nvm use 20), or pin older deps.`);

ok(`package manager: ${pm} (from lockfile)`);

const vitest = present("vitest");
if (installed("vitest")) ok(`vitest ${vitest}`);
else miss(`vitest not installed`, install("vitest @vitest/coverage-v8"));

// --- config / setup sanity (warn, don't block — bootstrapping is a valid path) ---
const hasConfig = ["vitest.config.ts", "vitest.config.mts", "vitest.config.js", "vitest.config.mjs", "vite.config.ts", "vite.config.mts"]
  .some((f) => fs.existsSync(path.join(root, f)));
if (hasConfig) ok(`vitest config present`);
else warn(`no vitest config found — bootstrap one (see references/vitest-setup.md) before writing tests`);

const isEsm = pkg.type === "module";
if (!isEsm && fs.existsSync(path.join(root, "vitest.config.ts"))) {
  warn(`project is not "type":"module" but config is vitest.config.ts — rename to vitest.config.mts if it uses ESM-only plugins (vite-tsconfig-paths)`);
}

// coverage must match vitest exactly
const cov = installed("@vitest/coverage-v8");
if (cov && vitest && cov !== installed("vitest")) {
  warn(`@vitest/coverage-v8 ${cov} ≠ vitest ${vitest} — pin them to the same version or coverage errors`);
}

// jest-dom engine gate on Node 20
const jestDom = installed("@testing-library/jest-dom");
if (jestDom) {
  const [maj, min] = minorOf(jestDom);
  if (nodeMajor < 22 && (maj > 6 || (maj === 6 && min >= 10))) {
    warn(`@testing-library/jest-dom ${jestDom} needs Node ≥22 (you're on ${process.version}) — pin 6.9.1`);
  }
}

// --- component stack (only with --component) ---
if (wantComponent) {
  const needReact = !installed("react") || !installed("react-dom");
  if (!needReact) ok(`react ${installed("react")} + react-dom`);
  else miss(`react / react-dom not installed (needed for component tests)`, install("react react-dom"));

  if (installed("jsdom")) ok(`jsdom ${installed("jsdom")}`);
  else miss(`jsdom not installed (the DOM environment)`, install("jsdom"));

  if (installed("@testing-library/react")) ok(`@testing-library/react ${installed("@testing-library/react")}`);
  else miss(`@testing-library/react not installed`, install("@testing-library/react @testing-library/dom"));

  // RTL 16 needs the dom peer installed explicitly.
  if (installed("@testing-library/react") && !installed("@testing-library/dom")) {
    miss(`@testing-library/dom peer missing (RTL 16 needs it explicitly)`, install("@testing-library/dom"));
  }

  if (installed("@vitejs/plugin-react")) ok(`@vitejs/plugin-react ${installed("@vitejs/plugin-react")}`);
  else miss(`@vitejs/plugin-react not installed (JSX transform — not next/jest)`, install("@vitejs/plugin-react"));
}

if (fixes.length) {
  console.log(`\nTo fix, run:`);
  for (const f of [...new Set(fixes)]) console.log(`  ${f}`);
  console.log(`  # then re-run preflight before writing tests.`);
}
console.log(hardFail ? `\n✗ requirements NOT met — stop and share the fixes above with the user.\n` : `\n✓ requirements met.\n`);
process.exit(hardFail ? 1 : 0);
