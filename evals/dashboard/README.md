# Eval dashboard

A persistent, browsable view of **every eval run** — no artifact downloads. Instead of the ephemeral
Actions artifacts, each graded run is appended to a dedicated **`eval-results`** branch that GitHub
Pages serves as a static site.

**Live dashboard:** `https://jonmodell.github.io/vitest-react-unit-testing/` (after the one-time setup below).

## How it works
- Every run already emits `report.json` + `report.html` (see `../harness/report.mjs`). Under CI, `run.mjs`
  also stamps provenance into the report (`commit`, `runUrl`, `actor`, `event`, `workflow`).
- The composite action `.github/actions/publish-dashboard` clones the `eval-results` branch (creating it
  as an orphan on first run) and calls `append-run.mjs`, which:
  - copies the run's `report.json` + `report.html` into `runs/<slug>.{json,html}`,
  - upserts an entry into `manifest.json` (the index the UI reads),
  - refreshes `index.html` (this dir's canonical copy) and `.nojekyll`,
  - then the action commits + pushes back to `eval-results`.
- `index.html` is static + client-side: it `fetch`es `manifest.json`, renders a sortable/filterable table
  of runs, and links each row to its stored `runs/<slug>.html` for the per-case detail (reusing the
  harness renderer — no duplication).

The `<slug>` is `ranAt_mode_provider_model_commit` (sanitized); the leading ISO timestamp makes lexical
order chronological. Re-publishing the same run is idempotent (upsert by slug).

## Who publishes
- **`grader.yml`** → publishes each **golden** run, but only on **push to `master`** (never on PRs, so
  fork PRs — which have read-only tokens — can't and don't publish). A regression timeline of the gate.
- **`model-eval.yml`** (you-only, dispatch) → publishes each **model** run. This is the interesting trend:
  models × cases over time.

No workflow triggers on `eval-results` pushes (grader watches `master`; model-eval is dispatch-only), so
there is **no publish loop**.

## One-time setup (repo owner)
1. Let CI run once on `master` (or dispatch `model-eval`) so the first publish **creates the `eval-results`
   branch**.
2. **Settings → Pages → Build and deployment → Deploy from a branch → Branch: `eval-results` / `/ (root)`** → Save.
3. Done. The built-in `GITHUB_TOKEN` with `contents: write` (already set on the publishing jobs) is enough
   to push within the same repo — **no PAT**.

## Local preview
`file://` blocks `fetch`, so serve over HTTP:
```bash
# produce + accumulate a couple of runs into a temp dir, then:
node evals/dashboard/append-run.mjs --report <dir-with-report.json> --pub /tmp/pub
cd /tmp/pub && python3 -m http.server 8099   # open http://localhost:8099/
```

## Files
- `index.html` — the dashboard UI (canonical copy; `append-run.mjs` publishes it to the branch root).
- `append-run.mjs` — accumulate one run into a checkout of the `eval-results` branch.
- (published branch only) `manifest.json`, `runs/<slug>.{json,html}`, `.nojekyll`.
