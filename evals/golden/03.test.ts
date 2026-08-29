import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ order: async () => ({ data: [{ id: 1 }, { id: 2 }], error: null }) }) }),
  }),
}));

import { loadActiveIds } from "./loadThings";

describe("loadActiveIds", () => {
  it("maps the client's rows to ids", async () => {
    await expect(loadActiveIds()).resolves.toEqual([1, 2]);
  });
});
