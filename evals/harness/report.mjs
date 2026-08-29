import fs from "node:fs";
import path from "node:path";

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

// Writes report.json (machine-readable) + report.html (open in a browser) into outDir.
export function writeReports(outDir, meta, results) {
  fs.mkdirSync(outDir, { recursive: true });
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass && !r.skip).length;
  const skipped = results.filter((r) => r.skip).length;
  const doc = { ...meta, summary: { passed, failed, skipped, total: results.length }, results };

  const jsonPath = path.join(outDir, "report.json");
  const htmlPath = path.join(outDir, "report.html");
  fs.writeFileSync(jsonPath, JSON.stringify(doc, null, 2));
  fs.writeFileSync(htmlPath, renderHtml(doc));
  return { jsonPath, htmlPath };
}

function renderHtml(doc) {
  const rows = doc.results
    .map((r) => {
      const state = r.skip ? "skip" : r.pass ? "pass" : "fail";
      const detail = r.skip
        ? esc(r.skip)
        : r.reasons && r.reasons.length
          ? `<pre>${esc(r.reasons.join("\n"))}</pre>`
          : "&mdash;";
      return `<tr class="${state}"><td class="id">${esc(r.id)}</td><td>${esc(r.unit ?? "")}</td><td class="badge">${state.toUpperCase()}</td><td class="detail">${detail}</td></tr>`;
    })
    .join("\n");
  const s = doc.summary;
  const metaBits = [`${doc.mode} mode`];
  if (doc.provider && doc.model) metaBits.push(`${doc.provider} · ${doc.model}`);
  else if (doc.model) metaBits.push(doc.model);
  if (doc.producerVersion) metaBits.push(doc.producerVersion);
  if (doc.commit) metaBits.push(`commit ${doc.commit}`);
  metaBits.push(doc.ranAt);
  const metaLine = metaBits.map(esc).join(" &middot; ");
  const runLink = doc.runUrl ? ` &middot; <a href="${esc(doc.runUrl)}">CI run &rarr;</a>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>vitest-react-unit-testing evals</title><style>
:root{color-scheme:light dark;--bg:#fafafa;--fg:#1a1a1a;--muted:#666;--line:#e3e3e3;--card:#fff;--pass:#1a7f37;--fail:#cf222e;--skip:#9a6700}
@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#8b949e;--line:#30363d;--card:#161b22;--pass:#3fb950;--fail:#f85149;--skip:#d29922}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif;padding:24px}
h1{font-size:18px;margin:0 0 4px}.meta{color:var(--muted);font-size:13px;margin-bottom:16px}
.pills{display:flex;gap:8px;margin:0 0 20px;flex-wrap:wrap}
.pill{padding:4px 12px;border-radius:999px;font-weight:600;font-size:13px;border:1px solid var(--line)}
.pill.p{color:var(--pass)}.pill.f{color:var(--fail)}.pill.s{color:var(--skip)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
tr:last-child td{border-bottom:none}.id{font-variant-numeric:tabular-nums;font-weight:600}
.badge{font-weight:700;font-size:12px}tr.pass .badge{color:var(--pass)}tr.fail .badge{color:var(--fail)}tr.skip .badge{color:var(--skip)}
.detail pre{margin:0;white-space:pre-wrap;font:12px/1.45 ui-monospace,monospace;color:var(--fail)}
</style></head><body>
<h1>vitest-react-unit-testing &mdash; eval report</h1>
<div class="meta">${metaLine}${runLink}</div>
<div class="pills"><span class="pill p">${s.passed} passed</span><span class="pill f">${s.failed} failed</span>${s.skipped ? `<span class="pill s">${s.skipped} skipped</span>` : ""}<span class="pill">${s.total} total</span></div>
<table><thead><tr><th>Case</th><th>Focus</th><th>Result</th><th>Detail</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>`;
}
