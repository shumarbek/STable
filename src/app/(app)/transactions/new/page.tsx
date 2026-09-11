import { redirect } from "next/navigation";
import { getActiveAccounts } from "@/features/accounts/queries";
import { getCategoryTree } from "@/features/categories/queries";
import { ExpenseWizard } from "@/features/transactions/ExpenseWizard";

export default async function NewTransactionPage() {
  const [accounts, expenseCategories] = await Promise.all([
    getActiveAccounts(),
    getCategoryTree("expense"),
  ]);

  if (accounts.length === 0) {
    redirect("/settings/accounts?notice=create-first-account");
  }

  return (
    <ExpenseWizard accounts={accounts} categories={expenseCategories} />
  );
}
