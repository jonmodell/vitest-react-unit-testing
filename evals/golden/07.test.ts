import { describe, expect, it } from "vitest";
import { highestPriority } from "./priority";

// Case 07 (verify-loop / no skips) — a clean, runnable test with no .only/.skip.
describe("highestPriority", () => {
  it("normal beats low", () => expect(highestPriority(["low", "normal"])).toBe("normal"));
  it("empty falls through to low", () => expect(highestPriority([])).toBe("low"));
});
