# Case 03 — Mock the boundary, not the unit

**Trigger:** test code that calls out to a data/network client.

**Input (prompt):** "Write a unit test for `loadActiveIds` in `fixtures/loadThings.ts` (it uses `./client`)."

**Expected behavior:** `vi.mock('./client', ...)` to control the returned `{data, error}`; asserts the happy path returns the mapped ids, and that an `error` makes it throw. Does **not** mock `loadThings` itself; makes no real network call.

**Pass criteria:** rubric R3, R5, R6. Auto-checks: `vitest run` green; file contains `vi.mock` of the client; no real I/O (`! grep -nE "fetch\(|https?://" <file>`).

**Failure mode guarded:** hitting a real client/network, or mocking the unit under test.

**Mutants (test must go red):** `off-by-one-ids` (rows mapped to `id + 1`).
