# Rubric — `vitest-react-unit-testing`

The skill's **success definition**, as gradeable criteria. Each case names which items are load-bearing.

| # | Criterion | Pass looks like |
|---|---|---|
| R1 | **Right layer** | Pure logic/hook → Vitest unit; small component → RTL; anything needing a real browser/backend/heavy grid → *declined and deferred to e2e*, not force-fit into a unit test. *Mechanized (agent mode) by the decline case (08): the correct output is **no** test — producing one fails it.* |
| R2 | **Failed first, for the right reason** | The agent ran the test and saw it fail (or deliberately broke the assertion to confirm), before making it pass — not a test that never could have failed. *Mechanized in the harness by the mutant check: the test must go red on each buggy fixture in `evals/mutants/<id>/`.* |
| R3 | **Runs green** | `vitest run <file>` passes. |
| R4 | **Deterministic** | No real clock (fake timers when time matters), no network/DB/filesystem, TZ-independent, no ordering assumptions. |
| R5 | **Mocks the boundary, not the unit** | The edge (client/clock/license) is mocked; the function under test is not. Behavior/output asserted — or, at a true boundary, the right builder calls asserted. |
| R6 | **Behavior over implementation** | Assertions target observable output or rendered result, not private internals. *Partial mechanical floor: `toMatch(Inline)?Snapshot` is forbidden on the pure-logic/handler cases (a snapshot there dodges a real assertion). Subtle violations still want a judge.* |
| R7 | **Hygiene** | No `.only`/`.skip`; co-located `*.test.ts(x)`; one behavior per `it` with behavior-named titles. |

**Scoring:** a case passes when its guarded failure mode is absent, its load-bearing rubric rows hold, and its auto-checks pass. Track per-case pass/fail; the suite passes when all its cases do.

**Mechanization status:** R2 (mutants), R3 (green run), R5 & R7 (per-case greps + placement), R4 (partial: `TZ=UTC` + fake-timer requires + no-network forbids), **R1 (decline case 08, agent mode)**, **R6 (partial: snapshot forbids)**. Fully judgment-only rows are now none — but R1/R6 coverage is a *floor*, not a ceiling (an LLM-judge could still add nuance).
