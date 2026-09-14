import { createClient } from "@/lib/supabase/server";

export interface ItemBreakdownRow {
  item_name: string;
  total_amount: number;
  occurrence_count: number;
}

export interface AccountDistributionRow {
  account_id: string;
  account_name: string;
  total_expense: number;
  total_income: number;
}

export interface MonthlyTrendRow {
  month_start: string;
  total_expense: number;
  total_income: number;
}

export interface TopTransactionRow {
  id: string;
  amount: number;
  note: string | null;
  category_name: string | null;
  transaction_date: string;
}

export async function getItemBreakdown(
  startDate: string,
  endDate: string,
  itemType?: string
): Promise<ItemBreakdownRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_item_breakdown", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_item_type: itemType ?? null,
  });

  if (error) {
    console.error("get_item_breakdown failed", error.message);
    return [];
  }

  return (data as ItemBreakdownRow[]) ?? [];
}

export async function getAccountDistribution(
  startDate: string,
  endDate: string
): Promise<AccountDistributionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_account_distribution", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("get_account_distribution failed", error.message);
    return [];
  }

  return (data as AccountDistributionRow[]) ?? [];
}

export async function getMonthlyTrend(months = 6): Promise<MonthlyTrendRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_monthly_trend", { p_months: months });

  if (error) {
    console.error("get_monthly_trend failed", error.message);
    return [];
  }

  return (data as MonthlyTrendRow[]) ?? [];
}

export async function getTopTransactions(
  startDate: string,
  endDate: string,
  limit = 5
): Promise<TopTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_top_transactions", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_limit: limit,
  });

  if (error) {
    console.error("get_top_transactions failed", error.message);
    return [];
  }

  return (data as TopTransactionRow[]) ?? [];
}
