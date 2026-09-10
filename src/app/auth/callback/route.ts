import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles both:
 *  - OAuth (Google) redirect: ?code=...
 *  - Email link confirmation / password reset: ?code=... (PKCE flow)
 * After exchanging the code for a session, redirects to `next` (defaults
 * to /dashboard). The middleware + dashboard layout then decide whether
 * to send the user to onboarding based on profile existence.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
