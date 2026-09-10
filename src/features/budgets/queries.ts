import { createClient } from "@/lib/supabase/server";

export interface BudgetProgressRow {
  budget_id: string;
  budget_name: string;
  category_id: string | null;
  amount_limit: number;
  spent_amount: number;
  percentage: number;
  period: string;
}

export async function getBudgetProgress(): Promise<BudgetProgressRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_budget_progress");

  if (error) {
    console.error("get_budget_progress failed", error.message);
    return [];
  }

  return (data as BudgetProgressRow[]) ?? [];
}
