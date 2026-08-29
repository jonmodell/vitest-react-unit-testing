# Eval harness (built)

A runnable harness that grades whether a test *produced under this skill* meets the contract.
For each case it copies the fixture into an isolated temp dir, places the produced test beside
it, runs the project's Vitest against it, applies the per-case auto-checks, and then runs the
mutation check (the test must go **red** on each buggy fixture in `../mutants/NN/`).

## Files
- `cases.mjs` — the machine-readable case registry (fixture, prompt, `requires`/`forbids` regexes). One entry per `../cases/NN-*.md`.
- `grade.mjs` — the graders: `runVitest` (green-run, pinned `TZ=UTC`), `checkGreps` (required/forbidden patterns), and `checkMutants` (the test must go red on each `../mutants/NN/` fixture).
- `report.mjs` — writes `report.json` + a self-contained `report.html`.
- `run.mjs` — the CLI runner.
- `sandbox/` — a throwaway Vitest project the grader runs in when there's no host project (CI).

(The requirements-gate self-test lives separately at `../preflight/run.mjs` — it exercises
`../../scripts/preflight.mjs`, not produced tests, so it is not part of this harness.)

## Output
Every run writes a report to `./eval-report/` (override with `--out <dir>`):
- **`report.json`** — `{ mode, ranAt, provider, model, producerVersion, summary:{…}, results:[{id,unit,pass,reasons}] }`. CI-friendly, and records **which provider/model/CLI-version produced the tests**. A surviving mutant shows up in `reasons` as `mutant survived …`.
- **`report.html`** — a standalone, theme-aware page whose header shows the model + producer version, with a pass/fail table and failure reasons. Open it directly in a browser; no server needed.

The console still prints `✓/✗` per case and the process exits non-zero if any case fails.

## Prerequisite
Run it **from a project that has Vitest installed** (e.g. one this skill just bootstrapped). The
harness borrows that project's `vitest` and config, so produced tests run exactly as the project
runs them. It creates/cleans a temp `.evals-tmp/` under that project.

## Usage
```bash
# from your project root:
H=~/.claude/skills/vitest-react-unit-testing/evals/harness/run.mjs

node "$H" --list                                   # list the cases
node "$H" --golden ../../golden                    # grade the committed golden tests (the free CI gate)
node "$H" --case 01 --candidate ./my.test.ts       # grade an existing test against case 01
node "$H"                                           # dry run (shows each case needs a candidate)
node "$H" --agent                                  # produce+grade EVERY case (default provider: claude)
node "$H" --case 02 --agent                        # produce+grade one case
node "$H" --agent --model claude-opus-4-8          # pin a Claude model
node "$H" --agent --provider gemini --model gemini-2.5-pro    # a Gemini model (needs the gemini CLI)
node "$H" --agent --provider openai --model gpt-5             # an OpenAI model (needs the codex CLI)
node "$H" --agent --producer 'ollama run {model} {prompt}' --model llama3   # ANY CLI (advanced)
```

## Modes
- **Golden mode (`--golden <dir>`)** — grade the committed known-good tests in `<dir>` (one
  `NN.test.ts` per case). Deterministic and free; this is the CI gate and must stay all-green.
- **Grader mode (`--candidate`)** — deterministic and free. You (or a Phase-1 run) supply the
  produced test; the harness runs it + the auto-checks + the mutation check. A candidate must import
  the fixture as `./<fixtureBasename>` (e.g. `./priority`), matching the case prompt.
- **Agent mode (`--agent`)** — spawns a fresh headless agent per case, in the temp dir that holds
  only the fixture, to write the test; the harness then grades it. It delegates to a provider CLI
  (not a direct API call), and **injects this skill's `SKILL.md` into the prompt** so every
  provider — not just Claude, which auto-loads it — actually receives the methodology being
  measured.
  - **`--provider`**: `claude` (default, `claude -p --permission-mode acceptEdits`), `openai` (the
    `codex` CLI), `gemini` (the `gemini` CLI), or `copilot` (the `copilot` CLI, `--allow-all -p`).
    The chosen CLI must be on PATH. **Verified end-to-end:** `copilot`.
  - **`--model`**: pins the model within the provider (e.g. `claude-opus-4-8`, `gpt-5`,
    `gemini-2.5-pro`, `gpt-5.4`); omit for the CLI's default.
  - **`--producer '<template>'`**: escape hatch for any other CLI/SDK — placeholders `{prompt}`,
    `{model}`, `{dir}` are substituted and the line is run in the case dir. Lets you eval Ollama,
    a custom SDK runner, etc. (Goes through a shell, so don't route skill-text prompts through it.)
  - Costs tokens. Case 06 (bootstrap) also runs shell commands — grant Bash or run it in a terminal
    that can approve it.
  - **`--repeat K`** (agent only): generation is the nondeterministic step, so grade each case **K
    times** and report per-case consistency (`passes/K` + a per-run ✓/✗ strip), mode `agent×K`. The
    report `summary` becomes case-passes / (cases×K).
  This is the automated form of Phase 1. If no provider is available, use grader/golden mode instead.

## CI
Two workflows at the skill repo root:
- **`grader.yml`** — free, on PRs/pushes, no secrets. Installs the `sandbox/` Vitest project, runs
  the preflight-gate self-test (`../preflight/run.mjs`), then grades the golden tests
  (`--golden ../../golden`), writing the pass/fail table to the run **summary** and uploading the
  report as an artifact. This is the gate.
- **`model-eval.yml`** — manual `workflow_dispatch`, guarded to the repo owner. Drives the Copilot
  CLI (agent mode) via the built-in `GITHUB_TOKEN` + `permissions: copilot-requests: write` (no PAT)
  to produce+grade with a real model. Because the report records `provider · model · producerVersion`,
  each artifact is self-identifying.

## What "pass" means
A case passes when the produced test **runs green** under Vitest, all `requires` patterns are
present, no `forbids` pattern appears, AND it goes **red on every mutant** in `../mutants/NN/`
(proving the assertions could actually fail). The runner prints `✓/✗` per case and exits non-zero if
any case fails — so it drops straight into CI.

## Scope note
This grades the mechanical, auto-checkable contract: green-on-correct + red-on-mutant (rubric R2,
"failed for the right reason", now mechanized by the mutation check) + selector/mock/hygiene
patterns. The remaining judgment rows in `../rubric.md` (e.g. "right layer", "behavior over
implementation") still want a human or LLM-judge; agent mode can be extended to call one against
`../rubric.md`.
