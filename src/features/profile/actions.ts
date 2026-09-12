"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validators/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
      gender: parsed.data.gender,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("auth_user_id", userData.user.id);

  if (error) {
    return { error: "Profilni yangilashda xatolik yuz berdi." };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAccount(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userData.user.id, false);
    if (error) {
      console.error("Supabase Auth foydalanuvchisini o‘chirish xatosi", error.message);
      return { error: "Hisobni o‘chirib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring." };
    }
  } catch (error) {
    console.error("Hisobni o‘chirish server xatosi", error);
    return { error: "Hisobni o‘chirib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring." };
  }

  await supabase.auth.signOut({ scope: "local" });
  return { success: true };
}
