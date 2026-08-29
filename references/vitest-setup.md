# Bootstrapping Vitest + React Testing Library from zero

Generic, copy-adaptable. Adjust versions to the project's React/TypeScript/Vite era.

## 1. Dev dependencies
```
vitest @vitest/coverage-v8   # keep these two on the SAME version
@vitejs/plugin-react         # JSX/TSX transform (do NOT use next/jest on Next projects)
jsdom                        # DOM environment
vite-tsconfig-paths          # resolve tsconfig path aliases (e.g. @/*) with no manual upkeep
@testing-library/react @testing-library/dom   # RTL 16 needs the dom peer explicitly
@testing-library/jest-dom @testing-library/user-event
```

## 2. Scripts (package.json)
```json
"test": "TZ=UTC vitest run",
"test:watch": "TZ=UTC vitest",
"coverage": "TZ=UTC vitest run --coverage"
```
`TZ=UTC` keeps date formatting stable across machines/CI.

## 3. `vitest.config.ts`
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", "dist/**"],
    coverage: { provider: "v8", include: ["src/**", "utils/**", "app/**"], reporter: ["text", "html"] },
  },
});
```

## 4. `vitest.setup.ts`
```ts
process.env.TZ = "UTC"; // must be first, before any date lib loads
import "@testing-library/jest-dom/vitest";

// jsdom is missing these; MUI-family and many UI libs need them BEFORE import.
class RO { observe() {} unobserve() {} disconnect() {} }
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (RO as any);
globalThis.matchMedia = globalThis.matchMedia ?? ((q: string) => ({
  matches: false, media: q, onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
} as any));

// If any component tree needs a license key, set it here before import, e.g.:
// import { LicenseInfo } from "@mui/x-license";
// LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY ?? "test");

// Non-empty placeholders so `!`-asserted env reads don't crash (real values stay mocked).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role";
```

## 5. Gotchas
- **ESM-only config deps** (e.g. `vite-tsconfig-paths` v5): if the project is NOT `"type": "module"`, Vite loads the config via `require` and throws *"ESM file cannot be loaded by require"*. Fix: name the config **`vitest.config.mts`** (forces ESM), or drop the plugin and use a manual `resolve.alias`.
- **Node-version pins**: some packages ship majors that require a newer Node than the project runs. Example: `@testing-library/jest-dom@6.10` needs Node ≥22 — on Node 20 pin `6.9.1`. When an install aborts with "engine … is incompatible", pin the last compatible minor rather than upgrading Node.
- **Next.js**: use `@vitejs/plugin-react`, not `next/jest`. Handlers that import `next/headers`, `server-only`, or middleware won't run under jsdom — unit-test only handlers that touch `NextRequest`/`NextResponse`, or extract the pure logic.
- **RTL 16** requires the `@testing-library/dom` peer installed explicitly.
- Keep `@vitest/coverage-v8` pinned to the exact `vitest` version or coverage errors.
- Polyfills and the license key must be registered in the setup file, which runs **before** test module imports.
