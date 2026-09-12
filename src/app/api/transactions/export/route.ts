import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exports the current user's transactions as CSV (spec section 104).
 * RLS guarantees only the caller's own rows are returned. Filtering by
 * date range can be added later via query params; for MVP this exports
 * everything, capped at a reasonable limit to avoid huge downloads.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return NextResponse.json({ error: "Tizimga kirilmagan" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "transaction_date, transaction_type, amount, currency, note, location, category:categories(name), account:user_accounts!transactions_account_id_fkey(name)"
    )
    .order("transaction_date", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface ExportRow {
    transaction_date: string;
    transaction_type: string;
    amount: number;
    currency: string;
    note: string | null;
    location: string | null;
    category: { name: string } | { name: string }[] | null;
    account: { name: string } | { name: string }[] | null;
  }

  const rows = (data ?? []) as unknown as ExportRow[];

  function relationName(rel: { name: string } | { name: string }[] | null): string {
    if (!rel) return "";
    return Array.isArray(rel) ? (rel[0]?.name ?? "") : rel.name;
  }

  const header = [
    "Sana",
    "Turi",
    "Summa",
    "Valyuta",
    "Kategoriya",
    "Hisob",
    "Izoh",
    "Manzil",
  ];

  function escapeCsv(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  const lines = [header.join(",")];
  const typeLabels: Record<string, string> = {
    expense: "Chiqim",
    income: "Kirim",
    transfer: "O‘tkazma",
    loan: "Qarz berish",
    debt_repayment: "Qarz qaytarish",
    refund: "Qaytarish",
  };
  for (const row of rows) {
    lines.push(
      [
        row.transaction_date,
        typeLabels[row.transaction_type] ?? row.transaction_type,
        String(row.amount),
        row.currency,
        relationName(row.category),
        relationName(row.account),
        row.note ?? "",
        row.location ?? "",
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const csv = "\uFEFF" + lines.join("\n"); // BOM for correct UTF-8 (Uzbek chars) opening in Excel

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stable-kirim-chiqimlar-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
