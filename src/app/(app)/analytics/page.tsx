import { getCurrentProfile } from "@/lib/supabase/profile";
import { monthBoundsFor, todayInTimeZone } from "@/lib/calculations/date";
import {
  getAccountDistribution,
  getMonthlyTrend,
  getTopTransactions,
  getMealStats,
  getItemBreakdown,
} from "@/features/analytics/queries";
import { getTopCategoriesThisMonth } from "@/features/dashboard/queries";
import { MonthlyTrendChart } from "@/features/analytics/MonthlyTrendChart";
import { AccountDistributionChart } from "@/features/analytics/AccountDistributionChart";
import { TopTransactionsList } from "@/features/analytics/TopTransactionsList";
import { ItemBreakdownList } from "@/features/analytics/ItemBreakdownList";
import { MealStatsCard } from "@/features/analytics/MealStatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";

export default async function AnalyticsPage() {
  const profile = await getCurrentProfile();
  const timezone = profile?.timezone ?? "Asia/Tashkent";
  const today = todayInTimeZone(timezone);
  const { start: monthStart } = monthBoundsFor(today);

  const [
    monthlyTrend,
    accountDistribution,
    topTransactions,
    mealStats,
    drinkBreakdown,
    topCategories,
  ] = await Promise.all([
    getMonthlyTrend(6),
    getAccountDistribution(monthStart, today),
    getTopTransactions(monthStart, today, 5),
    getMealStats(monthStart, today),
    getItemBreakdown(monthStart, today),
    getTopCategoriesThisMonth(monthStart, today, 10),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Analitika</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyTrendChart data={monthlyTrend} />
        <AccountDistributionChart data={accountDistribution} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategoriyalar bo&apos;yicha xarajat (shu oy)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {topCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
          )}
          {topCategories.map((cat) => (
            <div key={cat.category_id} className="flex items-center justify-between text-sm">
              <span>
                {cat.category_icon} {cat.category_name}
              </span>
              <span className="font-medium">
                {formatMoney(cat.total_amount)} ({cat.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ItemBreakdownList items={drinkBreakdown} />
        <TopTransactionsList transactions={topTransactions} />
      </div>

      <MealStatsCard stats={mealStats} />
    </div>
  );
}
