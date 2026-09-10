/**
 * Reliable "today" resolution for the calendar/date-picker UX.
 *
 * Priority:
 *   1. Our own `/api/time` route (runs on the server, reflects actual
 *      server clock — reliable in practice since server infra clocks
 *      are NTP-synced).
 *   2. Graceful fallback to the browser's local clock if the network
 *      request fails (offline, DNS issue, etc.) so the UI never breaks.
 *
 * This is a UX safeguard only. The authoritative rule that rejects
 * future-dated transactions lives in the database trigger
 * `enforce_no_future_transaction_date` (supabase/migrations/003).
 */
export async function getTrustedNow(): Promise<Date> {
  try {
    const res = await fetch("/api/time", { cache: "no-store" });
    if (!res.ok) throw new Error(`time endpoint responded ${res.status}`);
    const data: { nowIso: string } = await res.json();
    const parsed = new Date(data.nowIso);
    if (Number.isNaN(parsed.getTime())) throw new Error("invalid time payload");
    return parsed;
  } catch {
    // Fallback: local browser clock. Business-rule enforcement still
    // happens server-side regardless of this fallback.
    return new Date();
  }
}

/**
 * Converts a Date to a "YYYY-MM-DD" string in the given IANA timezone,
 * without pulling in a full date library for this one operation.
 */
export function toDateOnlyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}
