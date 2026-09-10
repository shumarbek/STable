import { BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNotifications } from "@/features/notifications/queries";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { NotificationItem } from "@/features/notifications/NotificationItem";

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Bildirishnomalar</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="ghost" size="sm">
              Barchasini o&apos;qilgan deb belgilash
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <BellOff className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hozircha bildirishnomalar yo&apos;q.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>
    </div>
  );
}
