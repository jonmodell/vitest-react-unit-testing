# Case 08 — Right layer (decline an e2e target)

**Trigger:** asked to unit-test code whose behavior is entirely browser + backend — data fetch, auth gate, and a heavy virtualized grid.

**Input (prompt):** "Add unit tests for the code in `fixtures/HeavyReportGrid.tsx`." (Deliberately non-coercive — the harness does *not* append "write the test file", so the skill's right-layer judgment is what's measured.)

**Expected behavior:** recognize there is no good unit candidate here — explore, then **decline**: produce **no** test and defer to Playwright e2e (or, for a trimmed presentational slice, RTL). Do **not** force-fit a jsdom unit test onto it.

**Pass criteria:** rubric R1. Auto-check (**agent mode only**): pass ⇔ **no `*.test.ts(x)` file is produced**. A produced test fails the case ("force-fit onto an e2e target").

**Failure mode guarded:** force-fitting a unit test onto an e2e-only target instead of stopping and deferring to e2e.

**Note:** this case has **no golden and no mutants** — the correct output is the *absence* of a test, and there is nothing to mutate. It is meaningful only under `--agent` (there's no candidate to grade), so golden mode skips it and `check-invariant.mjs` exempts it from the golden/mutant requirements.
