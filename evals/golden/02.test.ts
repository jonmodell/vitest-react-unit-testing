import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expiryStatus } from "./expiry";

describe("expiryStatus", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date("2026-08-29T00:00:00Z")));
  afterEach(() => vi.useRealTimers());

  it("returns '' for null", () => expect(expiryStatus(null)).toBe(""));
  it("flags a past date as expired", () => expect(expiryStatus("2026-08-01")).toBe("expired"));
  it("flags ~10 days out as expiring", () => expect(expiryStatus("2026-09-08")).toBe("expiring"));
  it("ignores ~60 days out", () => expect(expiryStatus("2026-10-28")).toBe(""));
});
