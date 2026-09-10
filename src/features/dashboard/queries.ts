import { createClient } from "@/lib/supabase/server";

export interface DashboardSummary {
  today_expense: number;
  today_income: number;
  today_transaction_count: number;
  week_expense: number;
  week_income: number;
  week_avg_daily_expense: number;
  month_expense: number;
  month_income: number;
  month_avg_daily_expense: number;
  current_balance: number;
}

export interface TopCategoryRow {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  total_amount: number;
  percentage: number;
}

export interface DailyTrendRow {
  day: string;
  total_expense: number;
  total_income: number;
}

/**
 * Fetches all dashboard aggregates via the get_dashboard_summary RPC.
 * All SUM/COUNT/GROUP BY happens in Postgres — see
 * supabase/migrations/007_dashboard_rpc_functions.sql.
 */
export async function getDashboardSummary(
  timezone: string
): Promise<DashboardSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_dashboard_summary", { p_timezone: timezone })
    .maybeSingle();

  if (error) {
    console.error("get_dashboard_summary failed", error.message);
    return null;
  }

  return (data as DashboardSummary) ?? null;
}

export async function getTopCategoriesThisMonth(
  monthStart: string,
  today: string,
  limit = 5
): Promise<TopCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_top_categories", {
    p_start_date: monthStart,
    p_end_date: today,
    p_limit: limit,
  });

  if (error) {
    console.error("get_top_categories failed", error.message);
    return [];
  }

  return (data as TopCategoryRow[]) ?? [];
}

export async function getDailyTrend(
  startDate: string,
  endDate: string
): Promise<DailyTrendRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_daily_trend", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("get_daily_trend failed", error.message);
    return [];
  }

  return (data as DailyTrendRow[]) ?? [];
}

export async function hasAnyTransaction(): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true });

  return (count ?? 0) > 0;
}
