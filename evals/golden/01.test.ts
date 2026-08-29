import { describe, expect, it } from "vitest";
import { highestPriority } from "./priority";

describe("highestPriority", () => {
  it("critical beats high", () => expect(highestPriority(["high", "critical"])).toBe("critical"));
  it("high beats normal", () => expect(highestPriority(["normal", "high"])).toBe("high"));
  it("empty falls through to low", () => expect(highestPriority([])).toBe("low"));
});
