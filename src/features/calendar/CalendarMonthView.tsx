"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import { uzMonthName } from "@/lib/calculations/date";
import type { CalendarDayRow } from "@/features/calendar/queries";
import { DayDetailPanel } from "@/features/calendar/DayDetailPanel";

const weekdayHeaders = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

export function CalendarMonthView({
  year,
  month,
  days,
  todayIso,
  selectedDay,
}: {
  year: number;
  month: number;
  days: CalendarDayRow[];
  todayIso: string;
  selectedDay?: string;
}) {
  const router = useRouter();
  const byDay = new Map(days.map((d) => [d.day, d]));

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday-first grid: convert JS Sunday=0 to Monday=0
  const jsFirstWeekday = firstOfMonth.getDay();
  const leadingBlanks = jsFirstWeekday === 0 ? 6 : jsFirstWeekday - 1;

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }),
  ];

  function goToMonth(deltaMonths: number) {
    const d = new Date(year, month - 1 + deltaMonths, 1);
    router.push(`/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card className="flex-1">
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => goToMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <p className="font-medium">
              {uzMonthName(month - 1)} {year}
            </p>
            <Button variant="ghost" size="icon" onClick={() => goToMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {weekdayHeaders.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, idx) => {
              if (!dateStr) return <div key={idx} />;
              const info = byDay.get(dateStr);
              const isFuture = dateStr > todayIso;
              const isToday = dateStr === todayIso;
              const isSelected = dateStr === selectedDay;
              const dayNum = Number(dateStr.split("-")[2]);

              const content = (
                <div
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs transition-colors",
                    isFuture
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "cursor-pointer hover:bg-muted",
                    isToday && "border-primary",
                    isSelected && "bg-primary/10 border-primary"
                  )}
                >
                  <span className={cn("font-medium", isToday && "text-primary")}>
                    {dayNum}
                  </span>
                  {!isFuture && info && info.total_expense > 0 && (
                    <span className="text-[10px] text-expense">
                      {formatMoney(info.total_expense)}
                    </span>
                  )}
                </div>
              );

              if (isFuture) {
                return <div key={dateStr}>{content}</div>;
              }

              return (
                <Link
                  key={dateStr}
                  href={`/calendar?year=${year}&month=${month}&day=${dateStr}`}
                  scroll={false}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="lg:w-80">
        <DayDetailPanel day={selectedDay ?? todayIso} />
      </div>
    </div>
  );
}
