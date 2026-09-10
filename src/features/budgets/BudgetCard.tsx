import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/calculations/money";
import { cn } from "cn";
import type { BudgetProgressRow } from "@/features/budgets/queries";

export function BudgetCard({ budget }: { budget: BudgetProgressRow }) {
  const pct = Math.min(budget.percentage, 100);
  const isWarning = budget.percentage >= 70 && budget.percentage < 100;
  const isOver = budget.percentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{budget.budget_name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {formatMoney(budget.spent_amount)} / {formatMoney(budget.amount_limit)}
          </span>
          <span
            className={cn(
              "font-medium",
              isOver ? "text-expense" : isWarning ? "text-warning" : "text-muted-foreground"
            )}
          >
            {budget.percentage.toFixed(1)}%
          </span>
        </div>
        <Progress
          value={pct}
          className={cn(
            isOver && "[&_[data-slot=progress-indicator]]:bg-expense",
            isWarning && "[&_[data-slot=progress-indicator]]:bg-warning"
          )}
        />
      </CardContent>
    </Card>
  );
}
