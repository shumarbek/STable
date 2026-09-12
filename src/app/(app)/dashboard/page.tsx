import { getCurrentProfile } from "@/lib/supabase/profile";
import {
  getDashboardSummary,
  getTopCategoriesThisMonth,
  getDailyTrend,
  hasAnyTransaction,
  getBalanceForecast,
} from "@/features/dashboard/queries";
import { todayInTimeZone, monthBoundsFor, weekBoundsFor } from "@/lib/calculations/date";
import { SummaryCards } from "@/features/dashboard/SummaryCards";
import { TopCategoriesCard } from "@/features/dashboard/TopCategoriesCard";
import { TrendChartCard } from "@/features/dashboard/TrendChartCard";
import { EmptyDashboardState } from "@/features/dashboard/EmptyDashboardState";
import { BalanceForecastCard } from "@/features/dashboard/BalanceForecastCard";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const timezone = profile?.timezone ?? "Asia/Tashkent";
  const today = todayInTimeZone(timezone);
  const { start: monthStart } = monthBoundsFor(today);
  const { start: weekStart } = weekBoundsFor(today);

  const [summary, topCategories, trend, hasTransactions, forecast] = await Promise.all([
    getDashboardSummary(timezone),
    getTopCategoriesThisMonth(monthStart, today),
    getDailyTrend(weekStart, today),
    hasAnyTransaction(),
    getBalanceForecast(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Salom, {profile?.full_name ?? ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Moliyaviy holatingizga umumiy nazar
        </p>
      </div>

      <SummaryCards summary={summary} currency={profile?.currency ?? "UZS"} />
      <BalanceForecastCard forecast={forecast} />

      {hasTransactions ? <div className="grid gap-4 lg:grid-cols-3">
        <TrendChartCard trend={trend} className="lg:col-span-2" />
        <TopCategoriesCard categories={topCategories} />
      </div> : <EmptyDashboardState fullName={profile?.full_name ?? ""} />}
    </div>
  );
}
