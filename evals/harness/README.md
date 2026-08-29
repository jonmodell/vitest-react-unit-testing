# Phase 2 — runnable eval harness (spec, not yet built)

Automates what Phase 1 does by hand: run every case, score it, report.

## Design
- **Runner**: Claude Agent SDK or headless Claude Code (`claude -p`), one invocation per `cases/NN-*.md`.
- **Isolation**: each run loads ONLY the `unit-testing-for-agents` skill and is given the case's task prompt + its `fixtures/` file copied into a throwaway temp project that already has Vitest configured (see `../references/vitest-setup.md`). No other skills, no repo context.
- **Capture**: collect the test file(s) the agent writes.
- **Auto-graders** (per case, from the case's "Pass criteria"):
  - run `vitest run` on the produced file → must exit 0
  - grep guards: no `\.(only|skip)\(`; no real I/O (`fetch(`, raw `http`, un-mocked client construction); case-specific greps (e.g. case 02 must contain `useFakeTimers`/`setSystemTime`; case 01 must NOT mock the unit under test).
  - optional **LLM-judge**: pass the produced file + `../rubric.md` + the case's load-bearing rows, ask for per-row pass/fail + a one-line reason.
- **Report**: a table of case → {auto-checks, rubric rows, overall pass/fail}, plus the diff of what the agent wrote. Non-zero exit if any case fails.

## Suggested layout (when built)
```
harness/
├── run.ts            # iterate cases/, spawn agent, collect output
├── graders/          # one grader per auto-check + the LLM-judge
├── tmp-project/      # a preconfigured Vitest sandbox the fixtures drop into
└── report.ts         # render + exit code
```

## Why phased
The rubric + fixtures are the real IP and are usable immediately by hand. The harness is pure automation on top — build it once the cases have stabilized, so you're not re-plumbing a runner every time a case changes.
