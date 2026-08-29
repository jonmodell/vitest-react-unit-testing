# TODO / roadmap

Evolving notes for refining the skill + evals. (Stable architecture lives in `CLAUDE.md`.)

## Verify / finish
- [ ] **Confirm the CI Copilot path on first dispatch** — `model-eval.yml` uses the built-in
      `GITHUB_TOKEN` + `copilot-requests: write` (different from the local `copilot` login we
      verified). Requires **Copilot CLI in Actions enabled** for the account.
- [ ] **Enable branch protection on `main`** (require PR review) so no one can edit the actor guard
      and merge it without you.
## Skill / eval quality
- [ ] Add an **LLM-judge** for the rubric's remaining judgment-only rows (right-layer,
      behavior-over-implementation) — the harness auto-checks the mechanical rows only. **Fail-first
      (R2) is now mechanized** via the mutation check (`evals/mutants/` + `checkMutants`).
- [ ] Consider more cases/fixtures: a real **RTL component** case, a **custom hook** case.
- [ ] `find-candidates.mjs` heuristic: it undercounts multiline / nested-generic function signatures
      (regex-based). Fine for "is anything here worth testing", but could be tightened.

## Nice-to-haves
- [ ] A `report.html` index when multiple models are compared locally (one folder per model).
- [ ] Pin exact model ids that are known-good with the Copilot CLI once observed.

## Done (for reference)
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
