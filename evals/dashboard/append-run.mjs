#!/usr/bin/env node
// Accumulate ONE eval run into the published dashboard tree (the `eval-results` branch checkout).
// Copies the run's report.json (data) and report.html (detail view — reuses the harness renderer,
// zero re-implementation), updates manifest.json, and refreshes the static index.html + .nojekyll.
//
//   node evals/dashboard/append-run.mjs --report <dir-with-report.json> --pub <eval-results-checkout>
//
// Idempotent per slug: re-publishing the same run overwrites its files and its manifest entry.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_SRC = path.join(__dirname, "index.html");

const args = process.argv.slice(2);
const val = (flag) => (args.indexOf(flag) >= 0 ? args[args.indexOf(flag) + 1] : undefined);
const reportDir = val("--report");
const pub = val("--pub");
if (!reportDir || !pub) {
  console.error("usage: append-run.mjs --report <dir-with-report.json> --pub <eval-results-checkout>");
  process.exit(2);
}

const jsonPath = path.join(reportDir, "report.json");
const htmlPath = path.join(reportDir, "report.html");
if (!fs.existsSync(jsonPath)) {
  console.error(`no report.json in ${reportDir} — nothing to publish (did the eval produce a report?)`);
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// A filesystem-safe, sortable, unique slug. ranAt (ISO) leads so lexical order = chronological.
const safe = (s) => String(s ?? "na").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "na";
const slug = [report.ranAt, report.mode, report.provider, report.model, report.commit ?? "local"].map(safe).join("_");

const runsDir = path.join(pub, "runs");
fs.mkdirSync(runsDir, { recursive: true });
fs.copyFileSync(jsonPath, path.join(runsDir, `${slug}.json`));
if (fs.existsSync(htmlPath)) fs.copyFileSync(htmlPath, path.join(runsDir, `${slug}.html`));

// Update the manifest (upsert by slug).
const manifestPath = path.join(pub, "manifest.json");
let manifest = [];
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); } catch { manifest = []; }
  if (!Array.isArray(manifest)) manifest = [];
}
const s = report.summary ?? {};
// Per-case results, normalized to { p: passes, n: runs } (n=1 for a single run), so the dashboard
// matrix has per-case data without fetching every run's JSON. Skips become { skip: true }.
const cases = {};
for (const r of report.results ?? []) {
  if (r.skip) cases[r.id] = { skip: true };
  else if (typeof r.runs === "number") cases[r.id] = { p: r.passes, n: r.runs };
  else cases[r.id] = { p: r.pass ? 1 : 0, n: 1 };
}
const entry = {
  slug,
  ranAt: report.ranAt ?? null,
  mode: report.repeat ? `${report.mode}×${report.repeat}` : report.mode ?? null,
  provider: report.provider ?? null,
  model: report.model ?? null,
  passed: s.passed ?? 0,
  failed: s.failed ?? 0,
  total: s.total ?? 0,
  commit: report.commit ?? null,
  runUrl: report.runUrl ?? null,
  cases,
};
manifest = manifest.filter((m) => m.slug !== slug);
manifest.push(entry);
manifest.sort((a, b) => String(b.ranAt).localeCompare(String(a.ranAt)));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Refresh the UI shell + disable Jekyll processing (so files starting with _ etc. are served as-is).
fs.copyFileSync(INDEX_SRC, path.join(pub, "index.html"));
fs.writeFileSync(path.join(pub, ".nojekyll"), "");

console.log(`published run ${slug} — ${entry.passed}/${entry.total} passed (${manifest.length} run(s) total)`);
