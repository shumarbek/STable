import { createClient } from "@/lib/supabase/server";
import type { BalanceEntry, UserAccount } from "@/types/database";

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
