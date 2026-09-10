"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/calculations/money";
import { deleteGoal } from "@/features/goals/actions";
import type { Goal } from "@/types/database";

export function GoalCard({ goal }: { goal: Goal }) {
  const [isPending, startTransition] = useTransition();
  const pct = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">{goal.name}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteGoal(goal.id);
              if ("error" in result) toast.error(result.error);
            })
          }
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}
          </span>
          <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
        </div>
        <Progress value={pct} />
        {goal.deadline && (
          <p className="text-xs text-muted-foreground">Muddat: {goal.deadline}</p>
        )}
        {goal.is_completed && (
          <p className="text-xs font-medium text-income">Maqsadga erishildi! 🎉</p>
        )}
      </CardContent>
    </Card>
  );
}
