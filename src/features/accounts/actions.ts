"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountFormSchema } from "@/lib/validators/account";
import { z } from "zod";

const accountBalanceSchema = z.object({
  cashBalance: z.coerce.number().min(0, "Naqd summa manfiy bo‘lishi mumkin emas"),
  cardBalance: z.coerce.number().min(0, "Karta summasi manfiy bo‘lishi mumkin emas"),
});

export type AccountActionResult = { error: string } | { success: true };

export async function saveCurrentBalances(input: unknown): Promise<AccountActionResult> {
  const parsed = accountBalanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ma’lumotlar noto‘g‘ri" };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Sessiya topilmadi." };
  const { data: accounts, error: readError } = await supabase
    .from("user_accounts").select("id,type").eq("is_active", true);
  if (readError) return { error: "Hisoblarni o‘qib bo‘lmadi." };

  for (const method of ["cash", "card"] as const) {
    const matching = (accounts ?? []).filter((account) =>
      method === "card" ? account.type === "card" || account.type === "bank" : account.type === "cash"
    );
    const balance = method === "cash" ? parsed.data.cashBalance : parsed.data.cardBalance;
    if (matching.length) {
      const { error } = await supabase.from("user_accounts").update({ balance }).eq("id", matching[0].id);
      if (error) return { error: "Balansni yangilab bo‘lmadi." };
      if (matching.length > 1) {
        const { error: zeroError } = await supabase.from("user_accounts").update({ balance: 0 }).in("id", matching.slice(1).map((account) => account.id));
        if (zeroError) return { error: "Takroriy hisoblarni muvofiqlashtirib bo‘lmadi." };
      }
    } else {
      const { error } = await supabase.from("user_accounts").insert({
        user_id: userData.user.id, name: method === "cash" ? "Naqd" : "Karta",
        type: method, balance, currency: "UZS",
      });
      if (error) return { error: "Hisobni yaratib bo‘lmadi." };
    }
  }

  revalidatePath("/budgets"); revalidatePath("/dashboard");
  revalidatePath("/transactions/new"); revalidatePath("/settings/accounts");
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
  });

  if (error) {
    return { error: "Hisob yaratishda xatolik yuz berdi." };
  }

  revalidatePath("/settings/accounts");
  revalidatePath("/transactions/new");
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

  revalidatePath("/settings/accounts");
  return { success: true };
}
