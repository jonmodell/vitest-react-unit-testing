import { createClient } from "./client";

// MUTANT: the role gate dropped "manager" — a valid manager token is now forbidden.
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
  if (!["admin"].includes(role ?? "")) {
    return Response.json({ error: "forbidden" }, { status: 401 });
  }
  const supabase = createClient();
  const { data } = await supabase.from("things").select("id").order("id");
  return Response.json({ data });
}
