import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getActiveAccounts } from "@/features/accounts/queries";
import { getCategoryTree } from "@/features/categories/queries";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { deleteTransaction } from "@/features/transactions/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!transaction) {
    notFound();
  }

  const tx = transaction as Transaction;
  const profile = await getCurrentProfile();

  const [accounts, expenseCategories, incomeCategories, transferCategories] =
    await Promise.all([
      getActiveAccounts(),
      getCategoryTree("expense"),
      getCategoryTree("income"),
      getCategoryTree("transfer"),
    ]);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Amalni tahrirlash</CardTitle>
          <form action={deleteTransaction.bind(null, tx.id)}>
            <Button type="submit" variant="ghost" size="icon" aria-label="O'chirish">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <TransactionForm
            transactionId={tx.id}
            accounts={accounts}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            transferCategories={transferCategories}
            timezone={profile?.timezone ?? "Asia/Tashkent"}
            defaultValues={{
              transactionType: tx.transaction_type,
              accountId: tx.account_id,
              transferAccountId: tx.transfer_account_id,
              categoryId: tx.category_id ?? undefined,
              amount: tx.amount,
              transactionDate: tx.transaction_date,
              isZeroConsumption: tx.is_zero_consumption,
              note: tx.note ?? "",
              location: tx.location ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
