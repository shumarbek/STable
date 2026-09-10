import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveSubscriptions } from "@/features/subscriptions/queries";
import { getActiveAccounts } from "@/features/accounts/queries";
import { getFlatCategories } from "@/features/categories/queries";
import { CreateSubscriptionDialog } from "@/features/subscriptions/CreateSubscriptionDialog";
import { SubscriptionCard } from "@/features/subscriptions/SubscriptionCard";

export default async function SubscriptionsPage() {
  const [subscriptions, accounts, categories] = await Promise.all([
    getActiveSubscriptions(),
    getActiveAccounts(),
    getFlatCategories("expense"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Obunalar</h1>
        <CreateSubscriptionDialog accounts={accounts} categories={categories} />
      </div>

      {subscriptions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <RefreshCw className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hali takroriy to&apos;lovlar qo&apos;shilmagan.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {subscriptions.map((sub) => (
          <SubscriptionCard key={sub.id} subscription={sub} />
        ))}
      </div>
    </div>
  );
}
