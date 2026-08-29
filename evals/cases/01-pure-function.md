# Case 01 — Pure function

**Trigger:** test a pure function.

**Input (prompt):** "Write a unit test for `highestPriority` in `fixtures/priority.ts`."

**Expected behavior:** a co-located `priority.test.ts` covering each branch (`critical`/`high`/`normal`/`low`), precedence (`critical` beats `high` when both present), and the empty-array → `"low"` fallthrough. No mocks of any kind.

**Pass criteria:** rubric R1, R2, R3, R6, R7. Auto-checks: `vitest run` green; no `.only`/`.skip`; **must NOT `vi.mock` `priority`** (`! grep -n "vi.mock.*priority" <file>`).

**Failure mode guarded:** mocking away / not exercising the real unit under test.

**Mutants (test must go red):** `critical-not-first` (precedence broken); `fallthrough-normal` (empty → `normal`, not `low`).
