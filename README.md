# vitest-react-unit-testing

A reusable skill that teaches an AI coding agent to write **deterministic Vitest + React Testing
Library** unit and component tests in a **TypeScript / React (incl. Next.js)** project — plus an
**eval harness** that measures how well any model follows it.

It's packaged as a Claude Code skill (`SKILL.md` auto-loads there), but the methodology is
**model-agnostic**: the guidance applies to any coding agent, and the harness evaluates Claude,
GPT, Gemini, or any GitHub Models model. Pure-logic testing works for any TypeScript project;
component testing + setup assume React.

## Contents
- **`SKILL.md`** — the methodology + contract an agent follows.
- **`references/`** — from-scratch Vitest+RTL setup and copy-adaptable patterns.
- **`scripts/find-candidates.mjs`** — scope to a file/dir; classifies exports (PURE / LOGIC / COMP) and errors out when there's nothing worth unit-testing.
- **`evals/`** — a rubric + one case per known failure mode, and a runnable harness.

## Evaluate across models
```bash
H=evals/harness/run.mjs
node "$H" --list
node "$H" --case 01 --candidate ./some.test.ts                # grade an existing test (free, no model)
node "$H" --agent --provider github --model openai/gpt-4o     # GitHub Models (GITHUB_TOKEN)
node "$H" --agent --provider claude --model claude-opus-4-8   # or an agentic CLI: claude / openai / gemini
node "$H" --agent --producer 'ollama run {model} {prompt}' --model llama3   # any CLI/SDK
```
Every run writes `report.json` + a standalone `report.html` recording **provider · model · version**
to `./eval-report/`. See `evals/harness/README.md` for all modes.

## CI (GitHub Models)
`.github/workflows/evals.yml` runs the harness on **GitHub Models** — no API keys, just the built-in
`GITHUB_TOKEN` with `permissions: models: read`. Trigger it from **Actions → skill-evals → Run
workflow** and **pick a model from the dropdown** — each run evaluates **one** model; pull requests
use the default model automatically. The pass/fail table appears in the run summary, with
`report.html` uploaded as an artifact. Adjust the dropdown list to match your
[GitHub Models catalog](https://github.com/marketplace/models).
