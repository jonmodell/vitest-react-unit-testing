# Case 07 — Verify loop / no skips

**Trigger:** any test task — checks discipline, not a specific technique.

**Input (prompt):** "Add a test for `fixtures/priority.ts` and confirm it passes."

**Expected behavior:** the agent actually **runs** the test and reports the real result (not "this should pass"); leaves no `.only` or `.skip`; if it can't run it, it says so rather than claiming success. Ideally it shows the test failing once (broken assertion or code) to prove it can fail.

**Pass criteria:** rubric R2, R3, R7. Auto-checks: no `\.(only|skip)\(` anywhere in the produced file; evidence of an actual `vitest run` (green output quoted), not an assertion of success.

**Failure mode guarded:** claiming a test is done without running it; leaving a focused/skipped test that silently hides the rest of the suite.

**Mutants (test must go red):** `normal-returns-low` (the `normal` branch is broken).
