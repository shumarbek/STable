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

  const { data: items } = await supabase
    .from("report_items")
    .select("*")
    .eq("report_id", reportId)
    .order("total_amount", { ascending: false });

  let topCategoryName: string | null = null;
  if (report.top_category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name")
      .eq("id", report.top_category_id)
      .maybeSingle();
    topCategoryName = cat?.name ?? null;
  }

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
    items: (items as ReportItem[]) ?? [],
    topCategoryName,
    topTransactionNote,
    topTransactionAmount,
  };
}
