/**
 * Money handling helpers. Amounts coming from Supabase `numeric` columns
 * arrive as strings via postgrest-js in some configurations, or as
 * numbers depending on the client's parsing — we normalize to `number`
 * here at the boundary and never perform financial aggregation in the
 * browser; all SUM/GROUP BY happens in Postgres (see the RPC functions
 * in supabase/migrations/007_dashboard_rpc_functions.sql).
 *
 * For UZS (no subunit in everyday use) values are treated as whole
 * so'm. Display formatting always goes through `formatMoney`.
 */

export function toAmountNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formats an amount for display, e.g. 38000 -> "38 000 so'm".
 * Uses a space as the thousands separator, matching the spec examples.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = "UZS"
): string {
  const n = toAmountNumber(amount);
  const rounded = Math.round(n);
  // Intl's uz-UZ locale uses a non-breaking space (U+00A0) as the
  // thousands separator; normalize to a regular space for predictable
  // rendering/copy-paste behavior across the app.
  const formatted = new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  })
    .format(rounded)
    .replace(/\u00A0/g, " ");

  if (currency === "UZS") {
    return `${formatted} so'm`;
  }

  return `${formatted} ${currency}`;
}

/** Formats a signed amount with a leading +/- sign, useful for cash-flow displays. */
export function formatSignedMoney(
  amount: number | string | null | undefined,
  currency: string = "UZS"
): string {
  const n = toAmountNumber(amount);
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}${formatMoney(n, currency)}`;
}

/** Formats a percentage change value, e.g. 14.2 -> "+14.2%", -8.7 -> "-8.7%". */
export function formatPercentageChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
