import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionType } from "@/types/database";
import type { Category } from "@/types/database";
import { buildCategoryHierarchy, descendantCategoryIds } from "@/features/categories/hierarchy";

export interface TransactionListRow extends Transaction {
  category: { name: string; icon: string | null } | null;
  rootCategory: { id: string; name: string; icon: string | null } | null;
  detailCategoryName: string | null;
  account: { name: string } | null;
}

export interface TransactionCategoryTotal {
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  total_amount: number;
  transaction_count: number;
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
  const { data: categoryData } = await supabase.from("categories").select("*");
  const categories = (categoryData ?? []) as Category[];

  let query = supabase
    .from("transactions")
    .select(
      "*, category:categories(name, icon), account:user_accounts!transactions_account_id_fkey(name)",
      { count: "exact" }
    );

  if (filters.categoryId) {
    const categoryIds = descendantCategoryIds(categories, filters.categoryId);
    query = query.in("category_id", categoryIds.length ? categoryIds : [filters.categoryId]);
  }
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

  const hierarchy = buildCategoryHierarchy(categories);
  const rows = (data as unknown as Omit<TransactionListRow, "rootCategory" | "detailCategoryName">[]).map((row) => {
    const entry = row.category_id ? hierarchy.get(row.category_id) : null;
    return {
      ...row,
      rootCategory: entry ? { id: entry.root.id, name: entry.root.name, icon: entry.root.icon } : null,
      detailCategoryName: entry && entry.category.id !== entry.root.id ? entry.category.name : null,
    };
  });
  return {
    rows,
    totalCount: count ?? 0,
  };
}

export async function getTransactionCategoryTotals(filters: TransactionListFilters): Promise<TransactionCategoryTotal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_transaction_category_totals", {
    p_transaction_type: filters.transactionType ?? null,
    p_account_id: filters.accountId ?? null,
    p_category_id: filters.categoryId ?? null,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_amount_min: filters.amountMin ?? null,
    p_amount_max: filters.amountMax ?? null,
    p_search: filters.search?.trim() || null,
  });
  if (error) {
    console.error("get_transaction_category_totals failed", error.message);
    return [];
  }
  return ((data ?? []) as TransactionCategoryTotal[]).map((row) => ({
    ...row,
    total_amount: Number(row.total_amount),
    transaction_count: Number(row.transaction_count),
  }));
}
