import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Fetches the current authenticated user's profile row (or null if the
 * user has an auth session but hasn't completed onboarding yet).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}
