import { createClient } from "./client";

// MUTANT: rows are transformed with an off-by-one — ids come back shifted by 1.
export async function loadActiveIds(): Promise<number[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("things").select("id").order("id");
  if (error) throw new Error(error.message ?? "load failed");
  return (data ?? []).map((row) => row.id + 1);
}
