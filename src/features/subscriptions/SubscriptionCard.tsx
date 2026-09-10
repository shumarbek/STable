"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/calculations/money";
import { billingCycleLabels } from "@/lib/validators/subscription";
import { deactivateSubscription } from "@/features/subscriptions/actions";
import type { Subscription } from "@/types/database";

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">{subscription.provider_name}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deactivateSubscription(subscription.id);
              if ("error" in result) toast.error(result.error);
            })
          }
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <p className="font-medium">
          {formatMoney(subscription.amount)} /{" "}
          {billingCycleLabels[subscription.billing_cycle as keyof typeof billingCycleLabels]}
        </p>
        <p className="text-xs text-muted-foreground">
          Keyingi to&apos;lov: {subscription.next_billing_date}
        </p>
      </CardContent>
    </Card>
  );
}
