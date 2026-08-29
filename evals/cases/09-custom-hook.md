# Case 09 — Custom hook (renderHook)

**Trigger:** test a React custom hook (state + callbacks), no component render needed.

**Input (prompt):** "Write a Vitest unit test for the `useToggle` hook in `fixtures/useToggle.ts` using `renderHook`."

**Expected behavior:** a co-located `useToggle.test.ts` that drives the hook with `@testing-library/react`'s `renderHook`, wraps every state change in `act(...)`, and asserts the returned value — default false, flips on `toggle()`, honors the initial value, and `set(v)` forces a value. Runs under jsdom (a per-file `// @vitest-environment jsdom` docblock is enough; the hook is plain `.ts`, so no JSX transform).

**Pass criteria:** rubric R3, R4, R6, R7. Auto-checks: `vitest run` green; uses `renderHook` and `act(`; no `.only`/`.skip`; no snapshot.

**Failure mode guarded:** reaching for a full component render (or manual React internals) to test a hook instead of `renderHook`; asserting on implementation detail instead of the returned value.

**Mutants (test must go red):** `toggle-doesnt-flip` (toggle always sets true); `set-ignores-arg` (the explicit setter is a no-op).
