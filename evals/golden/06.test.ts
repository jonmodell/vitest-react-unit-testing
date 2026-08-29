import { describe, expect, it } from "vitest";
import { highestPriority } from "./priority";

// Case 06 (bootstrap-from-zero) fixture is the pure priority function; a valid test for it here
// exercises the grader once Vitest is set up.
describe("highestPriority", () => {
  it("critical beats high", () => expect(highestPriority(["high", "critical"])).toBe("critical"));
  it("empty falls through to low", () => expect(highestPriority([])).toBe("low"));
});
