"use server";

import { createClient } from "@/lib/supabase/server";
import { budgetFormSchema } from "@/lib/validators/budget";
import { revalidateAppData } from "@/lib/cache/revalidate-app-data";

export type BudgetActionResult = { error: string } | { success: true };

export async function createBudget(input: unknown): Promise<BudgetActionResult> {
  const parsed = budgetFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const { error } = await supabase.from("budgets").insert({
    user_id: userData.user.id,
    name: parsed.data.name,
    category_id: parsed.data.categoryId ?? null,
    amount_limit: parsed.data.amountLimit,
    period: parsed.data.period,
    warning_threshold_percent: parsed.data.warningThresholdPercent,
  });

  if (error) {
    return { error: "Budjet yaratishda xatolik yuz berdi." };
  }

  revalidateAppData();
  return { success: true };
}

export async function deactivateBudget(budgetId: string): Promise<BudgetActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ is_active: false })
    .eq("id", budgetId);

  if (error) {
    return { error: "Budjetni o'chirishda xatolik yuz berdi." };
  }

  revalidateAppData();
  return { success: true };
}
