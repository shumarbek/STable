import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCategoryHierarchy } from "@/features/categories/hierarchy";
import { buildTransactionsWorkbook, type ExportTransactionRecord } from "@/features/transactions/export-workbook";
import type { Category } from "@/types/database";

export const runtime = "nodejs";

interface NamedRelation { name: string }
interface ExportRow {
  id: string;
  category_id: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  transaction_type: string;
  amount: number;
  currency: string;
  is_zero_consumption: boolean;
  note: string | null;
  location: string | null;
  category: NamedRelation | NamedRelation[] | null;
  account: NamedRelation | NamedRelation[] | null;
  target: NamedRelation | NamedRelation[] | null;
}

function relationName(relation: NamedRelation | NamedRelation[] | null) {
  if (!relation) return "";
  return Array.isArray(relation) ? (relation[0]?.name ?? "") : relation.name;
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "Tizimga kirilmagan" }, { status: 401 });

  const { data: categoryData, error: categoryError } = await supabase.from("categories").select("*");
  if (categoryError) return NextResponse.json({ error: "Kategoriyalarni yuklab bo‘lmadi" }, { status: 500 });

  const rawRows: ExportRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from("transactions").select(
      "id,category_id,transaction_date,created_at,updated_at,transaction_type,amount,currency,is_zero_consumption,note,location,category:categories(name),account:user_accounts!transactions_account_id_fkey(name),target:user_accounts!transactions_transfer_account_id_fkey(name)"
    ).order("transaction_date", { ascending: false }).order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) return NextResponse.json({ error: "Hisobot ma’lumotlarini yuklab bo‘lmadi" }, { status: 500 });
    const page = (data ?? []) as unknown as ExportRow[];
    rawRows.push(...page);
    if (page.length < pageSize) break;
  }

  const hierarchy = buildCategoryHierarchy((categoryData ?? []) as Category[]);
  const rows: ExportTransactionRecord[] = rawRows.map((row) => {
    const category = row.category_id ? hierarchy.get(row.category_id) : null;
    return {
      id: row.id,
      transactionDate: row.transaction_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      transactionType: row.transaction_type,
      amount: Number(row.amount),
      currency: row.currency,
      isZeroConsumption: row.is_zero_consumption,
      rootCategory: category?.root.name ?? "Kategoriyasiz",
      detailCategory: relationName(row.category),
      accountName: relationName(row.account),
      targetAccountName: relationName(row.target),
      note: row.note ?? "",
      location: row.location ?? "",
    };
  });

  const workbook = buildTransactionsWorkbook(rows);
  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="STable-hisobot-${date}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
