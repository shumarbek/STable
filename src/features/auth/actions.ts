"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
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

/**
 * Returns the public origin used by Supabase email and OAuth callbacks.
 * A localhost value is useful during development, but must never leak into
 * production links. Vercel exposes the deployment and production domains as
 * trusted environment variables, so production remains correct even when an
 * old NEXT_PUBLIC_SITE_URL value was copied into the project settings.
 */
async function getPublicSiteUrl(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const configuredIsLocal = configuredUrl
    ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUrl)
    : false;

  if (configuredUrl && (process.env.NODE_ENV !== "production" || !configuredIsLocal)) {
    return configuredUrl;
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  // Local and non-Vercel deployments still work without extra configuration.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (process.env.NODE_ENV !== "production" && host) {
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`;
  }

  throw new Error("Production sayt manzili sozlanmagan");
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
  const siteUrl = await getPublicSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: "Ro'yxatdan o'tishda xatolik yuz berdi. Qayta urinib ko'ring." };
  }

  // Supabase intentionally returns a simulated user for an already-registered
  // email. Detect that response so the UI does not promise an email that will
  // never be sent.
  if (data.user && data.user.identities?.length === 0) {
    return {
      error:
        "Bu email avval ro'yxatdan o'tgan. Kirish yoki parolni tiklashdan foydalaning.",
    };
  }

  // When email confirmation is disabled (the zero-cost production setup),
  // Supabase creates a session immediately. Continue straight to onboarding
  // instead of leaving the user on a page waiting for an email that is not
  // required. Projects with confirmation enabled still use the email flow.
  if (data.session) {
    redirect("/onboarding");
  }

  redirect("/signup/verify-email");
}

export async function resendConfirmationEmail(
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
  const siteUrl = await getPublicSiteUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error?.status === 429) {
    return { error: "Juda ko'p so'rov yuborildi. Bir necha daqiqadan keyin qayta urinib ko'ring." };
  }

  if (error) {
    return { error: "Tasdiqlash xatini yuborib bo'lmadi. Keyinroq qayta urinib ko'ring." };
  }

  // Keep the response neutral so registered email addresses cannot be probed.
  return { success: true };
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
  const siteUrl = await getPublicSiteUrl();

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
  const siteUrl = await getPublicSiteUrl();

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
    gender: formData.get("gender"),
    avatarUrl: formData.get("avatarUrl") || undefined,
    region: formData.get("region"),
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
      p_gender: parsed.data.gender,
      p_avatar_url: parsed.data.avatarUrl ?? "",
      p_region: parsed.data.region,
    })
    .single();

  if (error || !profile) {
    return { error: "Profil yaratishda xatolik yuz berdi." };
  }

  // Every user starts with the two payment methods used by the product.
  await supabase.from("user_accounts").insert([
    { user_id: userData.user.id, name: "Naqd", type: "cash", balance: 0, currency: "UZS" },
    { user_id: userData.user.id, name: "Karta", type: "card", balance: 0, currency: "UZS" },
  ]);

  return {
    success: true,
    publicUserId: (profile as { public_user_id: string }).public_user_id,
  };
}
