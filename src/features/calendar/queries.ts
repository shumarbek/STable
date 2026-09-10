import { createClient } from "@/lib/supabase/server";

export interface CalendarDayRow {
  day: string;
  total_expense: number;
  total_income: number;
  transaction_count: number;
}

/** Per-day expense/income/count for a given month, computed in SQL. */
export async function getCalendarMonth(
  year: number,
  month: number
): Promise<CalendarDayRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_calendar_month", {
    p_year: year,
    p_month: month,
  });

  if (error) {
    console.error("get_calendar_month failed", error.message);
    return [];
  }

  return (data as CalendarDayRow[]) ?? [];
}
