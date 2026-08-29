# vitest-react-unit-testing

A reusable skill that teaches an AI coding agent to write **deterministic Vitest + React Testing
Library** unit and component tests in a **TypeScript / React (incl. Next.js)** project — plus an
**eval harness** that measures how well any model follows it.

It's packaged as a Claude Code skill (`SKILL.md` auto-loads there), but the methodology is
**model-agnostic**: the guidance applies to any coding agent, and the harness evaluates Claude,
GPT, Gemini, or any model you can reach via a CLI or API. Pure-logic testing works for any
TypeScript project; component testing + setup assume React.

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
node "$H" --golden evals/golden                               # grade the committed golden tests (free — the CI gate)
node "$H" --agent --provider claude --model claude-opus-4-8   # produce+grade via an agentic CLI: claude / openai / gemini
node "$H" --agent --producer 'ollama run {model} {prompt}' --model llama3   # any other CLI/SDK
```
Every run writes `report.json` + a standalone `report.html` recording **provider · model · version**
to `./eval-report/`. See `evals/harness/README.md` for all modes.

## CI
Two workflows, built for a **public repo with credentialed jobs locked to you**:

- **`grader.yml` — free, runs on PRs/pushes.** Grades the committed **golden tests** (`evals/golden/`) with the harness. No secrets, no model calls — safe for public contributions. Fails if a golden test stops passing the graders (a regression in the fixtures, graders, or setup).
- **`model-eval.yml` — manual, you-only.** `workflow_dispatch` + `if: github.actor == '<you>'`, so only you can start it. Produces tests with a real model (agent mode) via your Copilot CLI + a `COPILOT_PAT` secret, then grades them. It never runs on pull requests, so the PAT is never exposed publicly.

> Heads-up: GitHub Models (the earlier free inference API) was **[retired on 2026-07-30](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)**. Cross-model eval now runs either locally via the CLIs or in the you-only `model-eval` job. The Copilot CLI install/invocation in `model-eval.yml` is marked **TODO** — verify it against the current Copilot CLI docs before relying on it.
