"use server";

import { createClient } from "@/lib/supabase/server";
import { accountFormSchema } from "@/lib/validators/account";
import { revalidateAppData } from "@/lib/cache/revalidate-app-data";
import { z } from "zod";

const accountBalanceSchema = z.object({
  cashBalance: z.coerce.number().min(0, "Naqd summa manfiy bo‘lishi mumkin emas"),
  cardBalance: z.coerce.number().min(0, "Karta summasi manfiy bo‘lishi mumkin emas"),
  balanceDate: z.iso.date(),
});

export type AccountActionResult = { error: string } | { success: true };

export async function saveCurrentBalances(input: unknown): Promise<AccountActionResult> {
  const parsed = accountBalanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ma’lumotlar noto‘g‘ri" };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Sessiya topilmadi." };
  const { error } = await supabase.rpc("set_current_balances", {
    p_balance_date: parsed.data.balanceDate,
    p_cash_balance: parsed.data.cashBalance,
    p_card_balance: parsed.data.cardBalance,
  });
  if (error) {
    console.error("set_current_balances failed", error.message);
    return { error: "Balansni saqlab bo‘lmadi." };
  }

  revalidateAppData();
  return { success: true };
}

export async function createAccount(input: unknown): Promise<AccountActionResult> {
  const parsed = accountFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const { error } = await supabase.from("user_accounts").insert({
    user_id: userData.user.id,
    name: parsed.data.name,
    type: parsed.data.type,
      currency: parsed.data.currency,
      balance: parsed.data.initialBalance,
      balance_snapshot_amount: parsed.data.initialBalance,
  });

  if (error) {
    return { error: "Hisob yaratishda xatolik yuz berdi." };
  }

  revalidateAppData();
  return { success: true };
}

export async function deactivateAccount(accountId: string): Promise<AccountActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_accounts")
    .update({ is_active: false })
    .eq("id", accountId);

  if (error) {
    return { error: "Hisobni o'chirishda xatolik yuz berdi." };
  }

  revalidateAppData();
  return { success: true };
}
