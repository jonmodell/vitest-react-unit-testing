# Eval harness (built)

A runnable harness that grades whether a test *produced under this skill* meets the contract.
For each case it copies the fixture into an isolated temp dir, places the produced test beside
it, runs the project's Vitest against it, and applies the per-case auto-checks.

## Files
- `cases.mjs` — the machine-readable case registry (fixture, prompt, `requires`/`forbids` regexes). One entry per `../cases/NN-*.md`.
- `grade.mjs` — the graders: `runVitest` (green-run, pinned `TZ=UTC`) and `checkGreps` (required/forbidden patterns).
- `report.mjs` — writes `report.json` + a self-contained `report.html`.
- `run.mjs` — the CLI runner.
- `producers/github-models.mjs` — inference producer for GitHub Models (used by `--provider github` and CI).
- `sandbox/` — a throwaway Vitest project the grader runs in when there's no host project (CI).

## Output
Every run writes a report to `./eval-report/` (override with `--out <dir>`):
- **`report.json`** — `{ mode, ranAt, provider, model, producerVersion, summary:{…}, results:[{id,unit,pass,reasons}] }`. CI-friendly, and records **which provider/model/CLI-version produced the tests**.
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
node "$H" --case 01 --candidate ./my.test.ts       # grade an existing test against case 01
node "$H"                                           # dry run (shows each case needs a candidate)
node "$H" --agent                                  # produce+grade EVERY case (default provider: claude)
node "$H" --case 02 --agent                        # produce+grade one case
node "$H" --agent --model claude-opus-4-8          # pin a Claude model
node "$H" --agent --provider gemini --model gemini-2.5-pro    # a Gemini model (needs the gemini CLI)
node "$H" --agent --provider openai --model gpt-5             # an OpenAI model (needs the codex CLI)
node "$H" --agent --provider github --model openai/gpt-4o    # GitHub Models (inference API; GITHUB_TOKEN)
node "$H" --agent --producer 'ollama run {model} {prompt}' --model llama3   # ANY CLI (advanced)
```

## Two modes
- **Grader mode (`--candidate`)** — deterministic and free. You (or a Phase-1 run) supply the
  produced test; the harness runs it + the auto-checks. A candidate must import the fixture as
  `./<fixtureBasename>` (e.g. `./priority`), matching the case prompt.
- **Agent mode (`--agent`)** — spawns a fresh headless agent per case, in the temp dir that holds
  only the fixture, to write the test; the harness then grades it. It delegates to a provider CLI
  (not a direct API call), and **injects this skill's `SKILL.md` into the prompt** so every
  provider — not just Claude, which auto-loads it — actually receives the methodology being
  measured.
  - **`--provider`**: `claude` (default, uses `claude -p --permission-mode acceptEdits`), `openai`
    (uses the `codex` CLI), or `gemini` (uses the `gemini` CLI). The chosen CLI must be on PATH.
  - **`--model`**: pins the model within the provider (e.g. `claude-opus-4-8`, `gpt-5`,
    `gemini-2.5-pro`); omit for the CLI's default.
  - **`--provider github`**: uses **GitHub Models** — an inference API (not an agentic CLI), so no
    per-provider install. Auth is `GITHUB_TOKEN` (or `GITHUB_MODELS_TOKEN`); models are namespaced
    (`openai/gpt-4o`, `meta/Llama-3.3-70B-Instruct`, …). Endpoint overridable via
    `GITHUB_MODELS_ENDPOINT`. This is the provider CI uses.
  - **`--producer '<template>'`**: escape hatch for any other CLI/SDK — placeholders `{prompt}`,
    `{model}`, `{dir}` are substituted and the line is run in the case dir. Lets you eval Ollama,
    a custom SDK runner, etc.
  - Costs tokens. Case 06 (bootstrap) also runs shell commands — grant Bash or run it in a terminal
    that can approve it.
  This is the automated form of Phase 1. If no provider is available, use grader mode instead.

## CI — GitHub Models evals
`.github/workflows/evals.yml` (at the skill repo root) runs the harness against **one GitHub Models
model per run** — chosen from a **dropdown** on manual dispatch (`Actions → skill-evals → Run
workflow`), or the default model on pull requests. It needs no API keys — only the built-in
`GITHUB_TOKEN` with `permissions: models: read`. The job:
1. installs the `sandbox/` Vitest project,
2. runs `node ../run.mjs --agent --provider github --model <selected>` from the sandbox,
3. writes the pass/fail table to the run **summary** and uploads `report.html`/`report.json` as an artifact.

Edit the dropdown `options` (and the PR default) to the exact ids from your GitHub Models catalog.
Because the report records `provider · model · producerVersion`, each artifact is self-identifying.

## What "pass" means
A case passes when the produced test **runs green** under Vitest AND all `requires` patterns are
present AND no `forbids` pattern appears. The runner prints `✓/✗` per case and exits non-zero if
any case fails — so it drops straight into CI.

## Scope note
This grades the mechanical, auto-checkable contract (green + selector/mock/hygiene patterns). The
judgment rows in `../rubric.md` (e.g. "failed for the right reason", "behavior over implementation")
still want a human or LLM-judge; agent mode can be extended to call one against `../rubric.md`.
