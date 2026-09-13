import { createClient } from "@/lib/supabase/server";
import type { WeeklyReport, ReportItem } from "@/types/database";

export async function getWeeklyReports(): Promise<WeeklyReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .order("week_start", { ascending: false });

  if (error || !data) {
    console.error("getWeeklyReports failed", error?.message);
    return [];
  }

  return data as WeeklyReport[];
}

export interface WeeklyReportDetail {
  report: WeeklyReport;
  items: ReportItem[];
  topCategoryName: string | null;
  topTransactionNote: string | null;
  topTransactionAmount: number | null;
}

export async function getWeeklyReportDetail(
  reportId: string
): Promise<WeeklyReportDetail | null> {
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return null;

  const { data: rootTotals } = await supabase.rpc("get_top_categories", {
    p_start_date: report.week_start,
    p_end_date: report.week_end,
    p_limit: 100,
  });
  const items: ReportItem[] = ((rootTotals ?? []) as Array<{
    category_id: string; category_name: string; total_amount: number; percentage: number;
  }>).map((item, index) => ({
    id: `${reportId}-${index}`,
    report_id: reportId,
    user_id: report.user_id,
    category_id: item.category_id,
    category_name: item.category_name,
    total_amount: Number(item.total_amount),
    percentage: Number(item.percentage),
    created_at: report.generated_at ?? report.created_at,
  }));
  const topCategoryName = items[0]?.category_name ?? null;

  let topTransactionNote: string | null = null;
  let topTransactionAmount: number | null = null;
  if (report.top_transaction_id) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("note, amount")
      .eq("id", report.top_transaction_id)
      .maybeSingle();
    topTransactionNote = tx?.note ?? null;
    topTransactionAmount = tx?.amount ?? null;
  }

  return {
    report: report as WeeklyReport,
    items,
    topCategoryName,
    topTransactionNote,
    topTransactionAmount,
  };
}
