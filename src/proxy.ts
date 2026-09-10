import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image (static assets)
     * - favicon.ico, manifest, icons, sw.js (PWA assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
