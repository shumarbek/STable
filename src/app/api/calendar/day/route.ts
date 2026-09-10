import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns all transactions for a single day (spec section 37, "Kunlik
 * view"). RLS on the transactions table guarantees this only ever
 * returns the current user's own rows.
 */
export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day");

  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_type, amount, note, is_zero_consumption, category:categories(name, icon)")
    .eq("transaction_date", day)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data ?? [] });
}
