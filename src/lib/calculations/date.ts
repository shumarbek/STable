/**
 * Date/period helpers used across dashboard, calendar, and reports.
 * All heavy aggregation happens in SQL; these helpers only compute the
 * date *boundaries* passed as RPC parameters.
 */

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Formats a Date as "YYYY-MM-DD" using its local (already-adjusted) fields. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Returns "today" as YYYY-MM-DD in the given IANA timezone. */
export function todayInTimeZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}`;
}

/** Monday-start week boundaries containing the given YYYY-MM-DD date string. */
export function weekBoundsFor(dateStr: string): { start: string; end: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = d.getDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toIsoDate(monday), end: toIsoDate(sunday) };
}

/** First/last day of the month containing the given YYYY-MM-DD date string. */
export function monthBoundsFor(dateStr: string): { start: string; end: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

/** Returns the previous period of equal length immediately before [start, end]. */
export function previousPeriod(start: string, end: string): { start: string; end: string } {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const lengthDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(s);
  prevEnd.setDate(s.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - (lengthDays - 1));

  return { start: toIsoDate(prevStart), end: toIsoDate(prevEnd) };
}

/** Human-readable Uzbek weekday name (short), for chart axis labels. */
export function uzWeekdayShort(dateStr: string): string {
  const names = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  const d = new Date(`${dateStr}T00:00:00`);
  return names[d.getDay()];
}

/** Human-readable Uzbek month name. */
export function uzMonthName(monthIndex: number): string {
  const names = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  return names[monthIndex];
}
