# CLAUDE.md — developing this repo

Instructions for an agent **working on this repo**. (Not to be confused with `SKILL.md`, which is
the skill's own content — the methodology an agent follows when *using* it in some other project.)

## What this is
`vitest-react-unit-testing` — a Claude Code skill that teaches an AI agent to write deterministic
**Vitest + React Testing Library** unit/component tests in a TypeScript/React (incl. Next.js)
project, **plus a runnable eval harness** that measures how well any model follows the skill. The
methodology is model-agnostic; only component testing + setup assume React.

## Layout
```
SKILL.md                     # the skill: methodology + Contract (trigger/inputs/outputs/success/failure modes)
references/                  # vitest-setup.md, patterns.md (copy-adaptable, generic)
scripts/find-candidates.mjs  # targeted usage: classify a file/dir's exports (PURE/LOGIC/COMP), exit≠0 if none worth unit-testing
scripts/preflight.mjs        # requirements gate: check Node/pm/vitest (+react/jsdom/RTL with --component), print fixes, exit≠0 if unmet
evals/
  cases/NN-*.md              # one human-readable case per known failure mode (01–07)
  rubric.md                  # the success definition as gradeable rows
  fixtures/*.ts              # tiny app-agnostic code the cases operate on
  golden/NN.test.ts          # a known-good test per case — graded by the free CI gate
  mutants/NN/<name>/*.ts     # buggy fixture(s) per case — the produced test MUST go red on each
  preflight/                 # SELF-TEST of scripts/preflight.mjs (run.mjs + fixture projects); NOT a case
  harness/
    run.mjs                  # CLI runner (grader / golden / agent modes)
    cases.mjs                # machine-readable case registry (fixture + prompt + requires/forbids regexes)
    grade.mjs                # runVitest (green, TZ=UTC) + checkGreps + checkMutants (red-on-broken)
    report.mjs               # writes report.json + standalone report.html (records provider·model·version)
    sandbox/                 # throwaway Vitest project the grader runs in when there's no host project (CI)
.github/workflows/           # grader.yml (free, PRs) + model-eval.yml (dispatch-only, you-only)
```

## The case invariant — keep these SIX in lockstep
Each known failure mode appears in all of: `SKILL.md` (Contract → Known failure modes) · `evals/cases/NN-*.md`
· `evals/harness/cases.mjs` · `evals/golden/NN.test.ts` · `evals/fixtures/` (its fixture) ·
`evals/mutants/NN/` (its buggy-fixture set). Adding or changing a case means updating all six, or the
harness/docs drift. When you add a mutant, run `--golden` — every golden must still catch it (stay
all-green), which is what proves the mutant is a real, must-catch behavior and not noise.

## Running the harness (verification)
Run **from a project that has Vitest installed** (the harness borrows its vitest) — locally use
`vps-staging`, or `cd evals/harness/sandbox && npm i` then `node ../run.mjs …`.
- `node evals/harness/run.mjs --list`
- `--golden evals/golden` — grade the golden tests (the free CI gate; must stay all-green)
- `--case NN --candidate <file>` — grade one test (deterministic, free)
- `--agent --provider claude|openai|gemini|copilot [--model X]` — produce+grade with a real model (costs)
- `--producer '<cmd with {prompt}/{model}/{dir}>'` — any other CLI/SDK
Reports land in `./eval-report/` (`report.json` + `report.html`). **Verified provider:** `copilot`
= `copilot --allow-all [--model auto|gpt-5.4|…] -p "<prompt>"`.

## Verify a change before committing
- `node --check` every edited `.mjs`; `node evals/harness/run.mjs --list`.
- `--golden evals/golden` stays **all-green** (from a vitest project / the sandbox).
- `node evals/preflight/run.mjs` stays **all-green** — the requirements-gate self-test (needs the
  sandbox installed; its "reqs met" scenario points there). Touch `scripts/preflight.mjs`? Re-run it.
- Validate workflow YAML (e.g. `ruby -ryaml -e "YAML.load_file('.github/workflows/grader.yml')"`).

## CI
- `grader.yml` — free, runs on PRs/pushes, no secrets: runs the preflight-gate self-test
  (`evals/preflight/run.mjs`) **and** grades the golden tests. The gate.
- `model-eval.yml` — manual `workflow_dispatch` + `if: github.actor == 'jonmodell'`; uses the built-in
  `GITHUB_TOKEN` + `permissions: copilot-requests: write` (**no PAT**) to drive the Copilot CLI.

## Gotchas / don'ts
- Vitest config must be **`.mts`** (ESM) — `vite-tsconfig-paths` is ESM-only and the repo isn't `type:module`.
- Pin `TZ=UTC` for date tests; jsdom needs ResizeObserver/matchMedia polyfills; on Node 20 pin `@testing-library/jest-dom@6.9.1`.
- **GitHub Models is retired (2026-07-30)** — don't reintroduce a `github` inference provider.
- `--provider` uses `execFileSync` (arg arrays, shell-safe); only `--producer` goes through a shell — don't route skill-text prompts through it (backticks/`$`).
- Don't hardcode a provider CLI's flags without checking its `--help`.
- Keep the case invariant in sync (see above).
