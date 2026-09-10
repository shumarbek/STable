"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validators/auth";

export type ProfileActionResult = { error: string } | { success: true };

export async function updateProfile(input: unknown): Promise<ProfileActionResult> {
  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      university_name: parsed.data.universityName,
      faculty: parsed.data.faculty ?? null,
      course: parsed.data.course ?? null,
    })
    .eq("auth_user_id", userData.user.id);

  if (error) {
    return { error: "Profilni yangilashda xatolik yuz berdi." };
  }

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Deletes the current user's account and all owned data. This is a
 * two-step process:
 *  1. `delete_own_account_data` RPC removes all `public` schema rows
 *     (transactions, budgets, goals, reports, notifications, ...).
 *  2. The auth identity itself (`auth.users` row, sessions) must be
 *     removed via the Supabase Admin API using the service-role key,
 *     which can only run in a trusted server context — see
 *     `supabase/functions/delete-account` (Edge Function). This action
 *     calls that Edge Function.
 */
export async function deleteAccount(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const { error: dataError } = await supabase.rpc("delete_own_account_data");

  if (dataError) {
    return { error: "Ma'lumotlarni o'chirishda xatolik yuz berdi." };
  }

  const { error: fnError } = await supabase.functions.invoke("delete-account");

  if (fnError) {
    return {
      error:
        "Ma'lumotlaringiz o'chirildi, lekin hisobni to'liq o'chirishda xatolik yuz berdi. Qo'llab-quvvatlash xizmatiga murojaat qiling.",
    };
  }

  await supabase.auth.signOut();
  return { success: true };
}
