# Case 04 — Spy query-builder (the boundary IS the behavior)

**Trigger:** test a unit whose job is to translate input into calls on a builder.

**Input (prompt):** "Write a unit test for `applyFilters` in `fixtures/applyFilters.ts`."

**Expected behavior:** builds a fake `Builder` with chainable `vi.fn()` `eq`/`in`/`gte`; asserts `since` → `gte`, an array → `in`, a scalar → `eq`, and that `undefined`/`null`/`""`/empty-array values are **skipped** (`.not.toHaveBeenCalledWith`).

**Pass criteria:** rubric R3, R5, R7. Auto-checks: `vitest run` green; uses `toHaveBeenCalledWith` and at least one `not.toHaveBeenCalled*` for a skipped value.

**Failure mode guarded:** failing to assert the boundary contract (or asserting private internals instead of the calls that are the behavior).
