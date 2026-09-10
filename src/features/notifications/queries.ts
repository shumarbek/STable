import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/types/database";

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error("getNotifications failed", error?.message);
    return [];
  }

  return data as AppNotification[];
}
