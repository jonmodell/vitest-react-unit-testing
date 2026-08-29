# Rubric — `vitest-react-unit-testing`

The skill's **success definition**, as gradeable criteria. Each case names which items are load-bearing.

| # | Criterion | Pass looks like |
|---|---|---|
| R1 | **Right layer** | Pure logic/hook → Vitest unit; small component → RTL; anything needing a real browser/backend/heavy grid → *declined and deferred to e2e*, not force-fit into a unit test. |
| R2 | **Failed first, for the right reason** | The agent ran the test and saw it fail (or deliberately broke the assertion to confirm), before making it pass — not a test that never could have failed. |
| R3 | **Runs green** | `vitest run <file>` passes. |
| R4 | **Deterministic** | No real clock (fake timers when time matters), no network/DB/filesystem, TZ-independent, no ordering assumptions. |
| R5 | **Mocks the boundary, not the unit** | The edge (client/clock/license) is mocked; the function under test is not. Behavior/output asserted — or, at a true boundary, the right builder calls asserted. |
| R6 | **Behavior over implementation** | Assertions target observable output or rendered result, not private internals. |
| R7 | **Hygiene** | No `.only`/`.skip`; co-located `*.test.ts(x)`; one behavior per `it` with behavior-named titles. |

**Scoring:** a case passes when its guarded failure mode is absent, its load-bearing rubric rows hold, and its auto-checks pass. Track per-case pass/fail; the suite passes when all 7 do.
