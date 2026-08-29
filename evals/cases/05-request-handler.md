# Case 05 — Request handler with decode-only auth

**Trigger:** test a request handler that decodes (does not verify) a Bearer JWT and gates on a role.

**Input (prompt):** "Write a unit test for `handle` in `fixtures/handler.ts` (it uses `./client`)."

**Expected behavior:** `vi.mock('./client')` to control returned data; hand-crafts decode-only tokens (base64url of a claims payload, **no signing library**); asserts 401 with no `Authorization`, 401 for a `worker` role, and 200 with `{data}` for a `manager`.

**Pass criteria:** rubric R3, R5, R6. Auto-checks: `vitest run` green; client is mocked; token is built by hand (`! grep -nE "jsonwebtoken|jose|sign\(" <file>`).

**Failure mode guarded:** trying to sign JWTs, hitting a real client, or writing tests that imply signature verification the code doesn't do.

**Mutants (test must go red):** `manager-rejected` (role gate drops `manager`, so a valid manager is forbidden).
