import { getCurrentProfile } from "@/lib/supabase/profile";
import { getCalendarMonth } from "@/features/calendar/queries";
import { todayInTimeZone } from "@/lib/calculations/date";
import { CalendarMonthView } from "@/features/calendar/CalendarMonthView";

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string; day?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const timezone = profile?.timezone ?? "Asia/Tashkent";
  const todayIso = todayInTimeZone(timezone);
  const [todayYear, todayMonth] = todayIso.split("-").map(Number);

  const year = Number(params.year) || todayYear;
  const month = Number(params.month) || todayMonth;

  const days = await getCalendarMonth(year, month);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Taqvim</h1>
      <CalendarMonthView
        year={year}
        month={month}
        days={days}
        todayIso={todayIso}
        selectedDay={params.day}
      />
    </div>
  );
}
