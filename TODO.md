# TODO / roadmap

Evolving notes for refining the skill + evals. (Stable architecture lives in `CLAUDE.md`.)

## Verify / finish
- [ ] **Confirm the CI Copilot path on first dispatch** — `model-eval.yml` uses the built-in
      `GITHUB_TOKEN` + `copilot-requests: write` (different from the local `copilot` login we
      verified). Requires **Copilot CLI in Actions enabled** for the account.
- [ ] **Enable branch protection on `master`** (require PR review) so no one can edit the actor guard
      and merge it without you.
- [ ] **Enable GitHub Pages** on the `eval-results` branch (Settings → Pages → Deploy from a branch)
      after the first publish creates it — see `evals/dashboard/README.md`.

## Skill / eval quality
- [ ] Add an **LLM-judge** for the rubric's remaining judgment-only rows (right-layer,
      behavior-over-implementation) — the harness auto-checks the mechanical rows only. **Fail-first
      (R2) is now mechanized** via the mutation check (`evals/mutants/` + `checkMutants`).
- [ ] Consider more cases/fixtures: a real **RTL component** case, a **custom hook** case.
- [ ] `find-candidates.mjs` heuristic: it undercounts multiline / nested-generic function signatures
      (regex-based). Fine for "is anything here worth testing", but could be tightened.

## Nice-to-haves
- [ ] Dashboard: a **model × case matrix** (latest run per model) and a **pass-rate-over-time** trend.
- [ ] Pin exact model ids that are known-good with the Copilot CLI once observed.

## Self-healing (roadmap)
- [ ] **(b) Repair-on-red** methodology in SKILL.md: when a previously-written test goes red, decide
      real-regression (report, don't heal) vs intended-change (update) — never loosen asserts to fake green.
- [ ] **(c) Eval-driven SKILL.md fix PRs**: on a model-eval failure, an agent proposes a minimal SKILL.md
      edit and opens a *draft* PR (gated by the golden+mutation+invariant gate; never auto-merged).

## Done (for reference)
- **Eval dashboard**: runs accumulate on the `eval-results` branch (composite action + `append-run.mjs`)
  and are served via GitHub Pages; provenance stamped into `report.json` under CI.
- **Invariant self-guard**: `evals/check-invariant.mjs` fails CI on six-way case drift or orphans.
- **Mutation check**: `evals/mutants/NN/` + `checkMutants` — each produced test must go red on every
  buggy fixture (mechanizes rubric R2, "failed for the right reason").
- **Requirements gate**: `scripts/preflight.mjs` (Node/pm/vitest, +react/jsdom/RTL with `--component`)
  + its self-test `evals/preflight/run.mjs`, wired into `grader.yml`.
- Scrubbed the retired GitHub-Models provider from `evals/harness/README.md`.
- Renamed from `unit-testing-for-agents` → `vitest-react-unit-testing`; dropped the Playwright skill.
- Harness: grader / golden / agent modes; providers claude|openai|gemini|copilot + `--producer`.
- Reports record provider·model·version (json + standalone html).
- CI split into free `grader.yml` (golden gate) + you-only `model-eval.yml` (Copilot, no PAT).
- `--provider copilot` verified end-to-end locally (case 01 PASS).
