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
  check-invariant.mjs        # self-guard: asserts the six-way case invariant is in sync; exit≠0 on drift
  dashboard/                 # Pages dashboard: index.html + append-run.mjs (accumulate runs → eval-results branch)
  harness/
    run.mjs                  # CLI runner (grader / golden / agent modes)
    cases.mjs                # machine-readable case registry (fixture + prompt + requires/forbids regexes)
    grade.mjs                # runVitest (green, TZ=UTC) + checkGreps + checkMutants (red-on-broken)
    report.mjs               # writes report.json + standalone report.html (records provider·model·version)
    sandbox/                 # throwaway Vitest project the grader runs in (CI); has react/jsdom for the hook case (09)
.github/workflows/           # grader.yml (free, PRs) + model-eval.yml (dispatch-only, you-only)
```

## The case invariant — keep these SIX in lockstep
Each known failure mode appears in all of: `SKILL.md` (Contract → Known failure modes) · `evals/cases/NN-*.md`
· `evals/harness/cases.mjs` · `evals/golden/NN.test.ts` · `evals/fixtures/` (its fixture) ·
`evals/mutants/NN/` (its buggy-fixture set). Adding or changing a case means updating all six, or the
harness/docs drift. When you add a mutant, run `--golden` — every golden must still catch it (stay
all-green), which is what proves the mutant is a real, must-catch behavior and not noise.
**`evals/check-invariant.mjs` enforces this mechanically** (a free CI step): it fails on any case missing
one of the six artifacts, on a mutant that doesn't replace a real fixture, or on an orphan (a golden/
mutant/case-doc with no `CASES` entry). Run it after any case change. **Exception:** a case marked
`expectDecline: true` in `cases.mjs` (rubric R1, e.g. 08) legitimately has **no golden and no mutants**
(the correct output is *no* test) — the checker requires it to have neither, and only a case doc + fixture.

## Running the harness (verification)
Run **from a project that has Vitest installed** (the harness borrows its vitest) — locally use
`vps-staging`, or `cd evals/harness/sandbox && npm i` then `node ../run.mjs …`.
- `node evals/harness/run.mjs --list`
- `--golden evals/golden` — grade the golden tests (the free CI gate; must stay all-green)
- `--case NN --candidate <file>` — grade one test (deterministic, free)
- `--agent --provider claude|openai|gemini|copilot [--model X]` — produce+grade with a real model (costs)
- `--agent … --repeat K` — K-run consistency (agent only): generate+grade each case K times, report
  per-case `passes/K` (mode `agent×K`). Measures the nondeterministic generation step.
- `--producer '<cmd with {prompt}/{model}/{dir}>'` — any other CLI/SDK
Reports land in `./eval-report/` (`report.json` + `report.html`). **Verified provider:** `copilot`
= `copilot --allow-all [--model auto|gpt-5.4|…] -p "<prompt>"`.

## Verify a change before committing
- `node --check` every edited `.mjs`; `node evals/harness/run.mjs --list`.
- `--golden evals/golden` stays **all-green** (from a vitest project / the sandbox).
- `node evals/preflight/run.mjs` stays **all-green** — the requirements-gate self-test (needs the
  sandbox installed; its "reqs met" scenario points there). Touch `scripts/preflight.mjs`? Re-run it.
- `node evals/check-invariant.mjs` stays **all-green** — the six-way case-invariant self-guard.
- Validate workflow YAML (e.g. `ruby -ryaml -e "YAML.load_file('.github/workflows/grader.yml')"`); also
  `.github/actions/publish-dashboard/action.yml` when you touch the dashboard.

## CI
- `grader.yml` — free, runs on PRs/pushes (push trigger = **`master`**, the repo default — not `main`),
  no secrets: `grader` job runs the preflight self-test (`evals/preflight/run.mjs`), the invariant
  self-guard (`evals/check-invariant.mjs`), **and** grades the golden tests. A separate `publish` job
  (`needs: grader`, `if: push`, `contents: write`) sends the run to the dashboard — never on PRs, so
  fork PRs (read-only token) can't publish. The gate.
- `model-eval.yml` — manual `workflow_dispatch` + `if: github.actor == 'jonmodell'`; uses the built-in
  `GITHUB_TOKEN` + `permissions: copilot-requests: write` + `contents: write` (**no PAT**) to drive the
  Copilot CLI and publish the run to the dashboard. The `model` input is a **curated `choice` dropdown**
  (Actions can't populate it dynamically) — use Copilot slugs (`claude-sonnet-4.5`), not API ids
  (`claude-opus-4-8`). **Exit-code contract:** `run.mjs` exits **3** on a producer failure (agent mode,
  no case produced a test — bad model id / missing/unauthed CLI); the workflow turns that into a RED run
  and does **not** publish it. A real graded result (some cases red) exits **1**, stays green, and is
  published. Never blanket-`continue-on-error` the eval step — capture the code and gate on it.

## Dashboard (`evals/dashboard/`)
Every graded run is appended to the orphan **`eval-results`** branch (via the composite action
`.github/actions/publish-dashboard` → `append-run.mjs`), which **GitHub Pages** serves at
`https://jonmodell.github.io/vitest-react-unit-testing/`. Provenance (`commit`, `runUrl`, …) is stamped
into `report.json` by `run.mjs` under Actions. One-time setup + internals: `evals/dashboard/README.md`.
`index.html` there is the canonical UI; `append-run.mjs` republishes it each run, so edit it there.

## Gotchas / don'ts
- Vitest config must be **`.mts`** (ESM) — `vite-tsconfig-paths` is ESM-only and the repo isn't `type:module`.
- Pin `TZ=UTC` for date tests; jsdom needs ResizeObserver/matchMedia polyfills; on Node 20 pin `@testing-library/jest-dom@6.9.1`.
- **GitHub Models is retired (2026-07-30)** — don't reintroduce a `github` inference provider.
- `--provider` uses `execFileSync` (arg arrays, shell-safe); only `--producer` goes through a shell — don't route skill-text prompts through it (backticks/`$`).
- Don't hardcode a provider CLI's flags without checking its `--help`.
- Keep the case invariant in sync (see above).
