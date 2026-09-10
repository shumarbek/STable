"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userData.user.id)
    .eq("is_read", false);

  revalidatePath("/notifications");
}
