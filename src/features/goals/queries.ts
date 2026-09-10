import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/types/database";

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getGoals failed", error?.message);
    return [];
  }

  return data as Goal[];
}
