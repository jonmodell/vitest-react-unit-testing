# vitest-react-unit-testing

A user-level Claude Code skill: write deterministic **Vitest + React Testing Library** unit and
component tests in a **TypeScript / React (incl. Next.js)** project. Pure-logic testing works for
any TypeScript project; component testing + setup assume React.

- **`SKILL.md`** — the methodology + contract the agent follows.
- **`references/`** — from-scratch Vitest+RTL setup and copy-adaptable patterns.
- **`scripts/find-candidates.mjs`** — scope to a file/dir; classifies exports (PURE / LOGIC / COMP) and errors out when there's nothing worth unit-testing.
- **`evals/`** — the skill's own contract-verification suite (a rubric + one case per known failure mode) and a **runnable harness**.

## Evaluate the skill
```bash
H=evals/harness/run.mjs
node "$H" --list
node "$H" --case 01 --candidate ./some.test.ts               # grade an existing test (free, no LLM)
node "$H" --agent --provider github --model openai/gpt-4o    # produce+grade via GitHub Models
node "$H" --agent --provider claude --model claude-opus-4-8  # or an agentic CLI (claude/openai/gemini)
```
Every run writes `report.json` + a standalone `report.html` (recording **provider · model · version**) to `./eval-report/`. See `evals/harness/README.md` for all modes.

## CI (GitHub Models)
`.github/workflows/evals.yml` runs the harness across a **matrix of GitHub Models** on PRs and on
demand — no API keys, just the built-in `GITHUB_TOKEN` with `permissions: models: read`. Each
model's pass/fail table appears in the run summary, with `report.html` uploaded as an artifact.
Edit the `matrix.model` list to the exact ids from your
[GitHub Models catalog](https://github.com/marketplace/models).
