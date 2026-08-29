# TODO / roadmap

Evolving notes for refining the skill + evals. (Stable architecture lives in `CLAUDE.md`.)

## Open — needs you (I can't do these)
- [ ] **Enable branch protection on `master`** (require PR review) so no one can edit the actor guard
      and merge it without you.
- [ ] Re-run `copilot` → `/models` occasionally and refresh the `model-eval.yml` dropdown as
      availability changes (Opus is currently unavailable on this account).

## Deferred (chosen not to build yet)
- [ ] **LLM-judge** for rubric *nuance*: R1/R6 now have mechanical floors (decline case 08 + snapshot
      forbids), but a model-judge could still catch subtler behavior-over-implementation violations.
      Costs tokens, nondeterministic, model-eval-only.
- [ ] **Self-healing (b) Repair-on-red** SKILL.md section: when a previously-written test goes red,
      decide real-regression (report, don't heal) vs intended-change (update) — never loosen asserts.
- [ ] **Self-healing (c) Eval-driven SKILL.md fix PRs**: on a model-eval failure, an agent proposes a
      minimal SKILL.md edit and opens a *draft* PR (gated by the golden+mutation+invariant gate).
- [ ] `find-candidates.mjs` heuristic: undercounts multiline / nested-generic signatures (regex-based).
      Fine for "is anything here worth testing", but could be tightened.

## Nice-to-haves
- [ ] Dashboard: richer trend (per-case flakiness over time), CSV export.
- [ ] More cases: a full **RTL component render** case (08 only exercises the *decline*; a positive
      small-component RTL case would round out coverage).

## Done (for reference)
- **Rubric R1 mechanized**: decline case 08 (`HeavyReportGrid.tsx`) — agent must produce NO test for an
  e2e-only target; graded inversely, golden-mode-skipped, invariant-exempt.
- **Rubric R6 floor**: `toMatch(Inline)?Snapshot` forbidden on the pure-logic/handler cases.
- **Custom-hook case 09**: `renderHook` + `act` under a per-file jsdom docblock; sandbox gained
  react/react-dom/RTL/jsdom.
- **K-run consistency**: `run.mjs --repeat K` (agent) → per-case `passes/K`; `runs` input in model-eval.
- **Dashboard matrix**: model × case grid + per-model pass-rate sparkline; per-case data in the manifest.
- **model-eval hardening**: producer/model failure exits 3 → RED run (not green-but-empty); curated
  `model` dropdown from `/models`; model + ×K in the Actions run-name; Node-24 action bumps.
- **Eval dashboard**: runs accumulate on `eval-results` → GitHub Pages (live); provenance in report.json.
- **Invariant self-guard**: `evals/check-invariant.mjs` fails CI on six-way drift or orphans.
- **Mutation check**: `evals/mutants/NN/` + `checkMutants` (mechanizes rubric R2).
- **Requirements gate**: `scripts/preflight.mjs` + self-test `evals/preflight/run.mjs`.
- Copilot CI path verified end-to-end (model-eval dispatch produces real graded results).
- GitHub Pages enabled on `eval-results` (dashboard live).
- Scrubbed the retired GitHub-Models provider; renamed to `vitest-react-unit-testing`.
- Harness: grader / golden / agent modes; providers claude|openai|gemini|copilot + `--producer`;
  reports record provider·model·version (json + standalone html).
