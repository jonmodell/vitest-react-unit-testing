import { createClient } from "./client";

// DECODES (does not verify) a Bearer JWT and gates on role, then reads via the client.
// Mirrors a common service-role API-route shape. Tests: mock ./client + hand-craft tokens.
function decodeRole(token: string): string | undefined {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString()).user_role;
  } catch {
    return undefined;
  }
}

export async function handle(req: Request): Promise<Response> {
  const auth = req.headers.get("Authorization");
  if (!auth) return Response.json({ error: "no auth" }, { status: 401 });
  const role = decodeRole(auth.split(" ")[1] ?? "");
  if (!["admin", "manager"].includes(role ?? "")) {
    return Response.json({ error: "forbidden" }, { status: 401 });
  }
  const supabase = createClient();
  const { data } = await supabase.from("things").select("id").order("id");
  return Response.json({ data });
}
