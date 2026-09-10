import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealStats } from "@/features/analytics/queries";

export function MealStatsCard({ stats }: { stats: MealStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ovqatlanish statistikasi</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-6 text-sm">
        <div>
          <p className="text-2xl font-semibold">{stats.meal_count}</p>
          <p className="text-muted-foreground">Jami ovqat yozuvi</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-income">{stats.home_cooked_count}</p>
          <p className="text-muted-foreground">Uyda tayyorlangan (0 so&apos;m)</p>
        </div>
      </CardContent>
    </Card>
  );
}
