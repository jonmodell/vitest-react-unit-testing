# Evals — `unit-testing-for-agents`

These evals grade whether an agent *following this skill* produces the right testing behavior. There is **one case per known failure mode** in the skill's Contract, so the skill is measured against exactly the mistakes it exists to prevent.

## Structure
```
evals/
├── rubric.md        # the shared pass/fail criteria (= the skill's success definition)
├── cases/           # 01..07, one scenario per failure mode
├── fixtures/        # tiny self-contained TS the cases operate on
└── harness/         # Phase 2: a runnable, auto-scoring harness (spec only for now)
```

Each `cases/NN-*.md` has: **Trigger**, **Input** (task prompt + fixture), **Expected behavior**, **Pass criteria** (rubric items + auto-checks), **Failure mode guarded**.

## Phase 1 — run now (rubric + auto-checks)
For each case:
1. Start a fresh agent session with ONLY this skill loaded.
2. Give it the case's Input (task prompt + the fixture file).
3. Take the produced test file and grade it:
   - **Rubric** (`rubric.md`), by a human or an LLM-judge.
   - **Auto-checks** (mechanical):
     - the produced test runs green: `npx vitest run <file>`
     - no leftover skips: `! grep -REn '\.(only|skip)\(' <file>`
     - no real I/O: `! grep -REn "fetch\(|http|createClient\((?!\s*\))" <file>` (client must be mocked)
4. **Pass** = the case's guarded failure mode is absent AND every load-bearing rubric item holds AND auto-checks pass.

## Phase 2 — runnable harness (not built yet)
See `harness/README.md` for the spec: a runner that spawns an agent per case with only this skill, captures output, and scores automatically. Implement later.
