import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function NotificationsBell() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  const unreadCount = count ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      render={
        <Link href="/notifications" aria-label="Bildirishnomalar">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-expense text-[10px] font-medium text-expense-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      }
    />
  );
}
