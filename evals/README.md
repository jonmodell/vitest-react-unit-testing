# Evals — `vitest-react-unit-testing`

These evals grade whether an agent *following this skill* produces the right testing behavior. There is **one case per known failure mode** in the skill's Contract, so the skill is measured against exactly the mistakes it exists to prevent.

## Structure
```
evals/
├── rubric.md        # the shared pass/fail criteria (= the skill's success definition)
├── cases/           # 01..07, one scenario per failure mode
├── fixtures/        # tiny self-contained TS the cases operate on
├── golden/          # a known-good test per case — the free CI gate grades these
├── mutants/NN/      # buggy fixtures per case — the produced test MUST go red on each
├── preflight/       # self-test of scripts/preflight.mjs (the requirements gate)
└── harness/         # the runnable, auto-scoring harness (built — see harness/README.md)
```

Each `cases/NN-*.md` has: **Trigger**, **Input** (task prompt + fixture), **Expected behavior**, **Pass criteria** (rubric items + auto-checks), **Failure mode guarded**, **Mutants**.

## What "pass" means
A produced test passes a case when its guarded failure mode is absent, every load-bearing rubric row holds, and the mechanical checks pass:
- **Runs green** on the correct fixture: `vitest run <file>` (pinned `TZ=UTC`).
- **Goes red on every mutant** in `mutants/NN/` — proof the assertions could actually fail (rubric R2, mechanized).
- **Auto-checks**: no leftover `.only`/`.skip`; mocks the boundary, not the unit; per-case `requires`/`forbids` patterns.
Two special cases extend the set: **08 (right-layer decline)** — an e2e-only fixture where the correct
output is *no* test (rubric R1, agent-mode only, no golden/mutants); and **09 (custom hook)** — a
`renderHook` case under a per-file jsdom docblock. R6 has a partial mechanical floor (snapshot forbids);
subtle right-layer/behavior-over-implementation nuance still wants a human or LLM-judge.

## Running it
The harness is built — run it from a project that has Vitest installed (or `evals/harness/sandbox`):
```bash
node evals/harness/run.mjs --list                       # the cases
node evals/harness/run.mjs --golden evals/golden         # grade the golden tests (the free CI gate)
node evals/harness/run.mjs --case 01 --candidate <file>  # grade one produced test
node evals/harness/run.mjs --agent --provider claude     # produce+grade with a real model (costs)
node evals/preflight/run.mjs                             # the requirements-gate self-test (free)
```
See `harness/README.md` for every mode, provider, and the report format.
