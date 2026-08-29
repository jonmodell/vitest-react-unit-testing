# Copy-adaptable unit-test patterns

App-agnostic. Adapt names to the code under test.

## A. Fake-timer time-window test
For code that branches on "how far from now" (expiry, staleness, cooldowns).
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { statusFor } from "./thing";

describe("statusFor", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date("2026-08-29T00:00:00Z")));
  afterEach(() => vi.useRealTimers());

  it("flags a date 10 days out as expiring", () => {
    expect(statusFor({ date: "2026-09-08" })).toBe("expiring");
  });
  it("ignores a date 60 days out", () => {
    expect(statusFor({ date: "2026-10-28" })).toBe("");
  });
  it("flags a past date as expired", () => {
    expect(statusFor({ date: "2026-08-01" })).toBe("expired");
  });
});
```

## B. Mock a data-client module (mock the boundary)
Replace the network/DB client, not the function under test.
```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@some/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [{ id: 1 }], error: null }) }),
    }),
  }),
}));

import { loadThings } from "./loadThings";

it("returns rows from the client", async () => {
  await expect(loadThings()).resolves.toEqual([{ id: 1 }]);
});
```

## C. Spy query-builder (asserting the boundary IS the behavior)
When the unit's job is to translate input into calls on a builder.
```ts
import { describe, expect, it, vi } from "vitest";
import { applyFilters } from "./applyFilters";

const builder = () => {
  const b: any = {};
  b.eq = vi.fn(() => b);
  b.in = vi.fn(() => b);
  b.gte = vi.fn(() => b);
  return b;
};

it("routes each filter to the right clause", () => {
  const b = builder();
  applyFilters(b, { status: "active", ids: [1, 2], since: "2026-01-01", empty: "" });
  expect(b.eq).toHaveBeenCalledWith("status", "active");
  expect(b.in).toHaveBeenCalledWith("ids", [1, 2]);
  expect(b.gte).toHaveBeenCalledWith("since", "2026-01-01");
  // empty value skipped:
  expect(b.eq).not.toHaveBeenCalledWith("empty", "");
});
```

## D. Hand-crafted decode-only JWT for a request handler
When auth code only *decodes* a token (no signature verification), you don't need to sign anything.
```ts
const b64url = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (claims: object) =>
  `${b64url({ alg: "none", typ: "JWT" })}.${b64url(claims)}.sig`;

// usage: new Request("http://x/api/thing", {
//   method: "POST",
//   headers: { Authorization: `Bearer ${token({ user_role: "manager" })}` },
// });
```
Flag in tests that this reflects the app's real (decode-only) auth posture — don't imply verification exists.
