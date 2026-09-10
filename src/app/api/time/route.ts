import { NextResponse } from "next/server";

/**
 * Returns the current server time in ISO-8601 (UTC). This is the
 * trusted time source used by the client to validate calendar
 * selections before submission — never trust `Date.now()` from the
 * browser alone for business rules. The database also independently
 * enforces the "no future date" rule (see
 * supabase/migrations/003_transactions.sql,
 * enforce_no_future_transaction_date trigger), so this endpoint is a
 * UX convenience, not the sole line of defense.
 */
export async function GET() {
  return NextResponse.json(
    { nowIso: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
