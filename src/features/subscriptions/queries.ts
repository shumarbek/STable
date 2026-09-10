import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/types/database";

export async function getActiveSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("is_active", true)
    .order("next_billing_date", { ascending: true });

  if (error || !data) {
    console.error("getActiveSubscriptions failed", error?.message);
    return [];
  }

  return data as Subscription[];
}
