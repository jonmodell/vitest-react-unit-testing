import { createClient } from "./client";

// Unit under test: transforms the client's rows; throws on error. Mock ./client, not this.
export async function loadActiveIds(): Promise<number[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("things").select("id").order("id");
  if (error) throw new Error(error.message ?? "load failed");
  return (data ?? []).map((row) => row.id);
}
