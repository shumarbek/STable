"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountFormSchema } from "@/lib/validators/account";

export type AccountActionResult = { error: string } | { success: true };

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
