import { redirect } from "next/navigation";
import { getActiveAccounts } from "@/features/accounts/queries";
import { getCategoryTree } from "@/features/categories/queries";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTransactionPage() {
  const profile = await getCurrentProfile();
  const [accounts, expenseCategories, incomeCategories, transferCategories] =
    await Promise.all([
      getActiveAccounts(),
      getCategoryTree("expense"),
      getCategoryTree("income"),
      getCategoryTree("transfer"),
    ]);

  if (accounts.length === 0) {
    redirect("/settings/accounts?notice=create-first-account");
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi tranzaksiya</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            accounts={accounts}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            transferCategories={transferCategories}
            timezone={profile?.timezone ?? "Asia/Tashkent"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
