"use client";

import { useTransition } from "react";
import { BarChart3, Bell, Target, Wallet, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import { markNotificationRead } from "@/features/notifications/actions";
import type { AppNotification, NotificationType } from "@/types/database";

const iconByType: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  weekly_report: BarChart3,
  budget_warning: Wallet,
  subscription_due: RefreshCw,
  goal_milestone: Target,
  system: Bell,
};

export function NotificationItem({ notification }: { notification: AppNotification }) {
  const [, startTransition] = useTransition();
  const Icon = iconByType[notification.type] ?? Bell;

  return (
    <Card
      className={cn(!notification.is_read && "border-primary/40 bg-primary/5")}
      onClick={() => {
        if (!notification.is_read) {
          startTransition(() => markNotificationRead(notification.id));
        }
      }}
    >
      <CardContent className="flex items-start gap-3 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(notification.created_at).toLocaleString("uz-UZ")}
          </p>
        </div>
        {!notification.is_read && (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </CardContent>
    </Card>
  );
}
