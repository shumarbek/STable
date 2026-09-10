import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getGoals } from "@/features/goals/queries";
import { CreateGoalDialog } from "@/features/goals/CreateGoalDialog";
import { GoalCard } from "@/features/goals/GoalCard";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Maqsadlar</h1>
        <CreateGoalDialog />
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Target className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hali moliyaviy maqsad yaratilmagan.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
