import { describe, expect, it, vi } from "vitest";
import { applyFilters } from "./applyFilters";

const builder = () => {
  const b: any = {};
  b.eq = vi.fn(() => b);
  b.in = vi.fn(() => b);
  b.gte = vi.fn(() => b);
  return b;
};

describe("applyFilters", () => {
  it("routes each filter to the right clause and skips empties", () => {
    const b = builder();
    applyFilters(b, { status: "active", ids: [1, 2], since: "2026-01-01", empty: "" });
    expect(b.eq).toHaveBeenCalledWith("status", "active");
    expect(b.in).toHaveBeenCalledWith("ids", [1, 2]);
    expect(b.gte).toHaveBeenCalledWith("since", "2026-01-01");
    expect(b.eq).not.toHaveBeenCalledWith("empty", "");
  });
});
