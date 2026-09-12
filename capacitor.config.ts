import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for STable Android wrapper.
 *
 * Because STable relies on Next.js Server Components, Server Actions,
 * middleware/proxy, and API routes (Supabase session cookies, secure
 * server-side reads), it cannot be exported as fully static HTML
 * (`next export`). Instead, the Android app is a thin native wrapper
 * (WebView) that loads the deployed production URL, matching the
 * "same web codebase → Android APK" requirement (spec section 2/90)
 * without duplicating business logic in Kotlin.
 *
 * Local development: point `server.url` at your LAN IP running
 * `npm run dev` (e.g. http://192.168.1.50:3000) so the emulator/device
 * can reach it. Production builds should point at the real deployed
 * domain (Vercel).
 */
const config: CapacitorConfig = {
  appId: "uz.stable.app",
  appName: "STable",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://stable-uz.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
