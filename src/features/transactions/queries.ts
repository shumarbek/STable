import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionType } from "@/types/database";

export interface TransactionListRow extends Transaction {
  category: { name: string; icon: string | null } | null;
  account: { name: string } | null;
}

export interface TransactionListFilters {
  search?: string;
  categoryId?: string;
  accountId?: string;
  transactionType?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

export interface TransactionListResult {
  rows: TransactionListRow[];
  totalCount: number;
}

/**
 * Server-side filtered, sorted, paginated transaction list. All
 * filtering/sorting happens in the Postgrest query (translated to SQL),
 * never by fetching everything and filtering in JS (spec section 81).
 */
export async function getTransactionsList(
  filters: TransactionListFilters
): Promise<TransactionListResult> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select(
      "*, category:categories(name, icon), account:user_accounts!transactions_account_id_fkey(name)",
      { count: "exact" }
    );

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.transactionType) query = query.eq("transaction_type", filters.transactionType);
  if (filters.dateFrom) query = query.gte("transaction_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("transaction_date", filters.dateTo);
  if (filters.amountMin !== undefined) query = query.gte("amount", filters.amountMin);
  if (filters.amountMax !== undefined) query = query.lte("amount", filters.amountMax);
  if (filters.search) query = query.ilike("note", `%${filters.search}%`);

  switch (filters.sort) {
    case "oldest":
      query = query.order("transaction_date", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount", { ascending: true });
      break;
    default:
      query = query.order("transaction_date", { ascending: false }).order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error || !data) {
    console.error("getTransactionsList failed", error?.message);
    return { rows: [], totalCount: 0 };
  }

  return {
    rows: data as unknown as TransactionListRow[],
    totalCount: count ?? 0,
  };
}
