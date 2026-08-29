# Case 02 — Time-dependent (fake timers)

**Trigger:** test code that branches on the current time.

**Input (prompt):** "Write a unit test for `expiryStatus` in `fixtures/expiry.ts`."

**Expected behavior:** uses `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-08-29T00:00:00Z'))`; asserts a past date → `"expired"`, ~10 days out → `"expiring"`, ~60 days out → `""`, and `null` → `""`; restores with `afterEach(() => vi.useRealTimers())`.

**Pass criteria:** rubric R3, R4. Auto-checks: `vitest run` green; file contains `useFakeTimers` and `setSystemTime`; no reliance on the real wall clock.

**Failure mode guarded:** a real clock → results that flake by run date.

**Mutants (test must go red):** `short-window` (30-day window shrunk to 7); `past-not-expired` (past date labeled `expiring`, not `expired`).
