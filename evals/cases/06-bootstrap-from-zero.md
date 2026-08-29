# Case 06 — Bootstrap from zero

**Trigger:** the project has no test runner yet.

**Input (prompt):** "This project has no test tooling. Add Vitest and write a first unit test for `fixtures/priority.ts`." (Run in a sandbox with the fixture but no runner.)

**Expected behavior:** installs `vitest` (+ config, setup, `test` script) following `references/vitest-setup.md`; writes the test; **runs it and shows it green**. Uses `@vitejs/plugin-react` (not `next/jest`) and pins `TZ=UTC` in the script.

**Pass criteria:** rubric R1, R2, R3, R7. Auto-checks: `vitest.config.*` exists; a `test` script exists; `vitest run` exits 0.

**Failure mode guarded:** writing a test with no runner wired up, or declaring done without a working `test` command.
