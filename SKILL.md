---
name: unit-testing-for-agents
description: Write and maintain deterministic Vitest unit + React Testing Library component tests in a TypeScript/React project. Use when writing or updating unit or component tests, testing pure functions, logic, hooks, or small components, mocking module boundaries, or bootstrapping Vitest + RTL from scratch.
---

# Unit & component testing (Vitest + React Testing Library)

Guidance for an AI agent adding fast, deterministic unit/component tests in a TypeScript/React project. Browser flows, auth-gated screens, multi-page journeys, and heavy data grids belong in end-to-end tests — use the **`playwright-testing-for-agents`** skill for those.

## Contract
- **Trigger** — writing/updating a unit or component test; testing a pure function, logic, hook, or small component; mocking a module boundary; bootstrapping Vitest+RTL from scratch.
- **Inputs** — the target function/component and its source; the project's stack and existing test setup (or none); the command that runs tests; any env/license the code reads at import.
- **Outputs** — a correct-layer test co-located with its source (`*.test.ts(x)`), deterministic, **verified green by actually running it**, with zero `.only`/`.skip` left behind.
- **Success** — right unit-vs-component choice; the test failed for the *right reason* before it passed; it is deterministic across reruns and timezones; it mocks the boundary, not the unit; it asserts observable behavior, not implementation detail.
- **Known failure modes** — mocking away the very thing under test; using a real clock/network/DB; leaving `.only`/`.skip`; asserting implementation internals; reaching for RTL on a heavy DataGrid; forgetting jsdom polyfills or a required license key. (Each maps to one eval case in `evals/`.)

## Pick the layer
| The code is… | Test it as | Tool |
|---|---|---|
| A pure function, transform, reducer, or hook | unit | Vitest |
| A small presentational/logic component, few deps | component | RTL |
| A heavy data grid, real data-fetch, auth-gated screen, or multi-page flow | e2e — **defer to `playwright-testing-for-agents`** | Playwright |

Rule of thumb: **if mocking it out would delete the thing under test, promote it to e2e.**

## The write → run → verify loop
1. Write ONE test.
2. Run just that file (`vitest run path/to/file.test.ts`).
3. Watch it **fail for the reason you expect** (temporarily break the assertion or the code if it passes suspiciously fast).
4. Make it pass.
5. Run the whole file; then the suite.
6. Never leave `.only` or `.skip`. **An unverified test is not done** — if you didn't watch it run, it isn't finished.

## Determinism (non-negotiable)
- **No real clock.** Time-dependent code → `vi.useFakeTimers()` + `vi.setSystemTime(new Date('YYYY-MM-DDT00:00:00Z'))`; restore in `afterEach(() => vi.useRealTimers())`.
- **No network, no real DB, no filesystem.** Mock the boundary (below).
- **Seed randomness**; never assert on `Math.random`/`Date.now` output directly.
- **Pin the timezone** (`TZ=UTC` in the test script) so date formatting doesn't shift per machine.
- **No ordering assumptions** on unordered collections; sort before asserting.

## Mock the boundary, not the unit
- Mock the *edge* your code talks to (network client, DB client, clock, license), never the function you're testing.
- `vi.mock('the-client-module', ...)` to replace a data client; assert your code's observable output, not that it "called foo".
- The exception: at a true boundary (e.g. a query builder), spying that the right builder methods were called with the right args *is* the behavior — assert it.
- Prefer asserting **outputs and rendered results** over internal calls.

## Component tests in jsdom
- jsdom lacks `ResizeObserver` and `matchMedia` — register no-op polyfills in the setup file **before** importing any UI library, or MUI-family components throw.
- If a component (or its tree) needs a license key (e.g. MUI X), set it in the setup file, before import.
- Query the way a user would: `getByRole` / `getByLabelText` / `getByText`; interact with `@testing-library/user-event`; assert with `@testing-library/jest-dom` matchers.
- If a component drags in a real data grid, network, or auth — stop and move it to e2e.

## Naming & structure
- Co-locate: `foo.ts` → `foo.test.ts` beside it.
- One behavior per `it`; group with `describe` per unit.
- Test names state the behavior ("returns '-' for a null date"), not the function name.

## Bootstrapping from zero
No runner yet? Follow **`references/vitest-setup.md`** (deps, `vitest.config.ts`, a setup file with polyfills + env + license, scripts). Reusable, copy-adaptable patterns are in **`references/patterns.md`**.

## References
- `references/vitest-setup.md` — stand up Vitest + RTL from scratch.
- `references/patterns.md` — fake timers, module mocks, spy query-builders, decode-only JWTs.
- `evals/` — the skill's own contract-verification suite (rubric + one case per failure mode).
