---
name: vitest-react-unit-testing
description: Write and maintain deterministic unit and component tests with Vitest + React Testing Library in a TypeScript / React (including Next.js) project. Use when writing or updating unit or component tests, testing pure functions/logic/hooks/small components, mocking module boundaries, scoping tests to specific files or directories, or bootstrapping Vitest + RTL from scratch.
---

# Unit & component testing (Vitest + React Testing Library)

Guidance for an AI agent adding fast, deterministic unit/component tests with **Vitest + React Testing Library** in a TypeScript / React (incl. Next.js) project. Browser flows, auth-gated screens, multi-page journeys, and heavy data grids belong in **end-to-end tests (Playwright)** and are out of scope here.

## Prerequisites & tools
**Preflight — do this before writing anything.** Detect what the project already has instead of assuming:
- **Package manager** — match the repo's lockfile (`package-lock.json`→npm, `pnpm-lock.yaml`→pnpm, `yarn.lock`→yarn, `bun.lockb`→bun). Never introduce a second one.
- **Existing runner** — is there a `vitest.config.*` and a `test` script? If yes, adopt its config/aliases and just add tests. Only bootstrap (below) when there is none.
- **Node version** — check `.nvmrc`/`engines`; some deps pin a Node floor (see the matrix). If `node -v` is below it, pin the last compatible dep minor rather than upgrading Node.
- **TS module setup** — if the project is not `"type": "module"`, the Vitest config must be `vitest.config.mts` (ESM-only plugins break otherwise).

**Known-good version matrix** (guidance — adjust to the project's era; exact pins & why in `references/vitest-setup.md`):

| Package | Version | Note |
|---|---|---|
| Node | 18 / 20 / 22 LTS | Vitest 2 needs ≥18; `@testing-library/jest-dom` ≥6.10 needs ≥22 (on Node 20 pin `6.9.1`) |
| `vitest` + `@vitest/coverage-v8` | 2.x (≥1.6 works) | keep the two on the **same** version or coverage errors |
| `react` + `react-dom` | 18 or 19 | component tests only; pure logic needs neither |
| `@testing-library/react` | 16 | needs the `@testing-library/dom` peer installed **explicitly** |
| `@testing-library/jest-dom` | 6.9.1 (Node 20) / ≥6.10 (Node ≥22) | engine-gated — see Node row |
| `@testing-library/user-event` | 14 | user-like interaction |
| `jsdom` | ≥24 | the DOM environment |
| `@vitejs/plugin-react` | 4 | JSX/TSX transform — **not** `next/jest`, even on Next.js |
| `vite-tsconfig-paths` | 5 | resolves `@/*` aliases; ESM-only ⇒ config must be `.mts` |
| `typescript` | 5.x | — |

**Verify requirements (gate — run before writing any test).**
Run `node <this-skill>/scripts/preflight.mjs [--component] [--dir <projectRoot>]` (add `--component` when the target is a React component, so it also checks the react/jsdom/RTL stack).
- **Exit 0** — requirements met; proceed. (A `!` warning like "no vitest config" just means bootstrap first — see below.)
- **Exit 1** — a hard requirement is missing. **STOP. Do not write tests yet.** Show the user the exact fix commands the script printed (they use the project's own package manager), then either wait for them or, if you're cleared to modify the project, run the install yourself and re-run preflight until it's green.
- **Exit 2** — not a Node project / wrong directory. Confirm the path with the user before doing anything.

Never write tests against an environment that failed preflight — a green test there is meaningless, and a red one wastes a debugging loop on a missing dependency.

**Tools this skill uses**
- `node` + the repo's package manager — install deps, run scripts.
- `node <this-skill>/scripts/preflight.mjs [--component]` — verify requirements (above) before writing.
- `vitest run <file>` — run **one** test file; the heartbeat of the verify loop (never rely on watch mode for verification).
- `TZ=UTC` — set on every test invocation so date output is machine-stable.
- `node <this-skill>/scripts/find-candidates.mjs <path>` — classify a file/dir's exports (`PURE`/`LOGIC`/`COMP`) before writing; exits non-zero when nothing is worth unit-testing.

**Co-location is fixed:** the test lives beside its source (`foo.ts` → `foo.test.ts`), importing it by bare relative path with **no extension** (`from "./foo"`). Don't relocate the source or invent a `src/` layout to hold the test.

## Contract
- **Trigger** — writing/updating a unit or component test; testing a pure function, logic, hook, or small component; mocking a module boundary; bootstrapping Vitest+RTL from scratch.
- **Inputs** — the target function/component and its source; **optionally a specific file or directory to scope to** (explore it first — if it has no good unit-test candidates, stop and say so); the project's stack and existing test setup (or none); the command that runs tests; any env/license the code reads at import.
- **Outputs** — a correct-layer test co-located with its source (`*.test.ts(x)`), deterministic, **verified green by actually running it**, with zero `.only`/`.skip` left behind.
- **Success** — right unit-vs-component choice; the test failed for the *right reason* before it passed; it is deterministic across reruns and timezones; it mocks the boundary, not the unit; it asserts observable behavior, not implementation detail.
- **Known failure modes** — mocking away the very thing under test; using a real clock/network/DB; leaving `.only`/`.skip`; asserting implementation internals; reaching for RTL on a heavy DataGrid; forgetting jsdom polyfills or a required license key; forcing tests onto a target that has no good unit candidates (components/types) instead of stopping. (Each maps to one eval case in `evals/`.)

## Pick the layer
| The code is… | Test it as | Tool |
|---|---|---|
| A pure function, transform, reducer, or hook | unit | Vitest |
| A small presentational/logic component, few deps | component | RTL |
| A heavy data grid, real data-fetch, auth-gated screen, or multi-page flow | e2e (Playwright) — out of scope here | Playwright |

Rule of thumb: **if mocking it out would delete the thing under test, promote it to e2e.**

## Targeted usage: scope to a file or directory
When the user points you at specific file(s) or a directory, write tests **only** for those — don't wander into the rest of the codebase.
1. **Explore the target first:** `node <this-skill>/scripts/find-candidates.mjs <path>`. It lists each file's testable exports and tags them: `PURE` (ideal unit target), `LOGIC` (unit-testable by mocking the boundary), `COMP` (a React component → RTL/e2e, not a unit test).
2. **If it reports no good candidates** (it exits non-zero) — the target is only components, types, or config — **STOP and tell the user** there's nothing worth unit-testing here, and where it belongs instead (RTL for small components, Playwright e2e for screens/flows). **Do not fabricate low-value tests to look busy.**
3. Otherwise, write tests for the `PURE` and `LOGIC` exports it found, following the loop and rules below.

## The write → run → verify loop
1. Write ONE test.
2. Run just that file (`vitest run path/to/file.test.ts`).
3. Watch it **fail for the reason you expect** (temporarily break the assertion or the code if it passes suspiciously fast).
4. Make it pass.
5. Run the whole file; then the suite.
6. Never leave `.only` or `.skip`. **An unverified test is not done** — if you didn't watch it run, it isn't finished.

## Errors, stuck states & when to stop
Testing surfaces two kinds of failure — a bug in the *test* (fix it) and a signal that this target shouldn't be unit-tested this way (stop and escalate). Don't grind; diagnose, then act.

**Budget.** Give one test **≤3 real attempts** to go green. If it's still red after three *distinct* fixes (not the same edit retried), **stop and report** — the loop has become thrashing. Cap a single `vitest run` at ~30s; a test that hangs is almost always a real timer/promise/network leak, not slowness — investigate the leak, don't raise the timeout.

**Common failures → the actual fix:**
| Symptom | Cause | Do |
|---|---|---|
| `Cannot find module` / alias unresolved | missing dep or path alias not wired | re-run **preflight**; add the dep or `vite-tsconfig-paths` — don't rewrite the import to a brittle relative path |
| `ESM file cannot be loaded by require` | config is `.ts` in a non-ESM project | rename config to **`.mts`** (see setup reference) |
| `ReferenceError: ResizeObserver/matchMedia is not defined` | jsdom polyfills missing | add them to the **setup file**, before UI imports |
| Test hangs / times out | real timer, unresolved promise, or live network | mock the boundary; use fake timers; `await` the assertion — never bump the timeout to hide it |
| Passes even when you break the code | asserts nothing observable (a "always-green" test) | assert real output/behavior; confirm it goes red on a deliberate break |
| Flaky across runs | real clock, ordering, or shared state | pin `TZ=UTC` + fake timers; sort before asserting; reset mocks in `afterEach` |
| `engine … is incompatible` on install | dep major needs newer Node | pin the last compatible minor (e.g. `@testing-library/jest-dom@6.9.1` on Node 20) — don't force a Node upgrade |

**When to STOP and hand back to the user** (rather than keep trying):
- Preflight exit 1 and you're not cleared to install deps → give them the fix commands.
- The target turns out to be a component/screen/flow that needs a real browser or backend → say so and point to RTL/Playwright; don't force a unit test.
- A green test would require mocking the very thing under test → the unit is the wrong layer (promote to e2e).
- Three distinct fixes haven't made it pass → report what you tried, the last error, and your best hypothesis; ask rather than thrash.

Always report failures honestly: if a test is red, say so with the output — never disable, `.skip`, or loosen an assertion just to claim green.

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
