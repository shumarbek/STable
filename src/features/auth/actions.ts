"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signUpSchema,
  onboardingSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";

export type ActionResult = { error: string } | { success: true };
export type OnboardingResult =
  | { error: string }
  | { success: true; publicUserId: string };

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
}

export async function signUpWithEmail(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: "Ro'yxatdan o'tishda xatolik yuz berdi. Qayta urinib ko'ring." };
  }

  redirect("/signup/verify-email");
}

export async function loginWithEmail(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Email yoki parol xato." };
  }

  redirect("/dashboard");
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data?.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password/confirm`,
  });

  // Always return success, regardless of whether the email exists, to
  // avoid leaking which emails are registered (enumeration protection).
  return { success: true };
}

export async function confirmPasswordReset(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Parolni yangilashda xatolik yuz berdi." };
  }

  redirect("/dashboard");
}

export async function completeOnboarding(
  _prev: OnboardingResult | null,
  formData: FormData
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    universityName: formData.get("universityName"),
    faculty: formData.get("faculty") || undefined,
    course: formData.get("course") || undefined,
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi. Qaytadan kiring." };
  }

  const { data: profile, error } = await supabase
    .rpc("create_profile", {
      p_full_name: parsed.data.fullName,
      p_university_name: parsed.data.universityName,
      p_faculty: parsed.data.faculty ?? null,
      p_course: parsed.data.course ?? null,
    })
    .single();

  if (error || !profile) {
    return { error: "Profil yaratishda xatolik yuz berdi." };
  }

  // Give every new user a default cash wallet so they can log a
  // transaction immediately, without a mandatory "create account" step.
  await supabase.from("user_accounts").insert({
    user_id: userData.user.id,
    name: "Naqd",
    type: "cash",
    balance: 0,
    currency: "UZS",
  });

  return {
    success: true,
    publicUserId: (profile as { public_user_id: string }).public_user_id,
  };
}
