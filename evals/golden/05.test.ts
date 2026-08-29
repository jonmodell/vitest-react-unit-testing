import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ order: async () => ({ data: [{ id: 9 }], error: null }) }) }),
  }),
}));

import { handle } from "./handler";

const bearer = (claims: object) =>
  `Bearer ${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64")}.${Buffer.from(JSON.stringify(claims)).toString("base64")}.sig`;
const req = (auth?: string) => new Request("http://x/api", { headers: auth ? { Authorization: auth } : {} });

describe("handle", () => {
  it("401s without an Authorization header", async () => {
    expect((await handle(req())).status).toBe(401);
  });
  it("401s for a non-staff role", async () => {
    expect((await handle(req(bearer({ user_role: "worker" })))).status).toBe(401);
  });
  it("200s with rows for a manager", async () => {
    const res = await handle(req(bearer({ user_role: "manager" })));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: [{ id: 9 }] });
  });
});
