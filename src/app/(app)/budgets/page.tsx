import { getBudgetProgress } from "@/features/budgets/queries";
import { getFlatCategories } from "@/features/categories/queries";
import { CreateBudgetDialog } from "@/features/budgets/CreateBudgetDialog";
import { BudgetCard } from "@/features/budgets/BudgetCard";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function BudgetsPage() {
  const [budgets, categories] = await Promise.all([
    getBudgetProgress(),
    getFlatCategories("expense"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Budjetlar</h1>
        <CreateBudgetDialog categories={categories} />
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Wallet className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hali budjet yaratilmagan. Xarajatlaringizni nazorat qilish uchun
              birinchi budjetingizni yarating.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((b) => (
          <BudgetCard key={b.budget_id} budget={b} />
        ))}
      </div>
    </div>
  );
}
