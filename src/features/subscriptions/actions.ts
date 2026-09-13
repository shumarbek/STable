"use server";

import { createClient } from "@/lib/supabase/server";
import { subscriptionFormSchema } from "@/lib/validators/subscription";
import { revalidateAppData } from "@/lib/cache/revalidate-app-data";

export type SubscriptionActionResult = { error: string } | { success: true };

export async function createSubscription(input: unknown): Promise<SubscriptionActionResult> {
  const parsed = subscriptionFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userData.user.id,
    account_id: parsed.data.accountId ?? null,
    category_id: parsed.data.categoryId ?? null,
    provider_name: parsed.data.providerName,
    amount: parsed.data.amount,
    billing_cycle: parsed.data.billingCycle,
    next_billing_date: parsed.data.nextBillingDate,
  });

  if (error) {
    return { error: "Obuna yaratishda xatolik yuz berdi." };
  }

  revalidateAppData();
  return { success: true };
}

export async function deactivateSubscription(
  subscriptionId: string
): Promise<SubscriptionActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ is_active: false })
    .eq("id", subscriptionId);

  if (error) {
    return { error: "Obunani o'chirishda xatolik yuz berdi." };
  }

  revalidateAppData();
  return { success: true };
}
