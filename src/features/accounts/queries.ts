import { createClient } from "@/lib/supabase/server";
import type { AccountType, BalanceConversion, BalanceEntry, UserAccount } from "@/types/database";

export async function getActiveAccounts(): Promise<UserAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("getActiveAccounts failed", error?.message);
    return [];
  }

  return data as UserAccount[];
}

export async function getAllAccounts(): Promise<UserAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("getAllAccounts failed", error?.message);
    return [];
  }

  return data as UserAccount[];
}

export async function getBalanceEntries(): Promise<BalanceEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("balance_entries").select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data) {
    console.error("getBalanceEntries failed", error?.message);
    return [];
  }
  return data as BalanceEntry[];
}

interface ConversionRow {
  id: string;
  amount: number;
  transaction_date: string;
  note: string | null;
  created_at: string;
  account: { name: string; type: AccountType } | { name: string; type: AccountType }[] | null;
  target: { name: string; type: AccountType } | { name: string; type: AccountType }[] | null;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getBalanceConversions(): Promise<BalanceConversion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").select(
    "id,amount,transaction_date,note,created_at,account:user_accounts!transactions_account_id_fkey(name,type),target:user_accounts!transactions_transfer_account_id_fkey(name,type)"
  ).eq("transaction_type", "transfer")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error("getBalanceConversions failed", error?.message);
    return [];
  }

  return (data as unknown as ConversionRow[]).flatMap((row) => {
    const source = firstRelation(row.account);
    const target = firstRelation(row.target);
    if (!source || !target) return [];
    return [{
      id: row.id,
      amount: Number(row.amount),
      transaction_date: row.transaction_date,
      note: row.note,
      created_at: row.created_at,
      source_name: source.name,
      source_type: source.type,
      target_name: target.name,
      target_type: target.type,
    }];
  });
}
