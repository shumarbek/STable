import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config (spec section 87). Tests run against a local
 * dev server. Since STable requires a real Supabase backend to
 * exercise auth/RLS, these tests expect NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to be set (via .env.local) and
 * a test user seeded — see e2e/README.md for setup notes.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobil",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
    {
      name: "planshet",
      use: { ...devices["iPad Pro 11"], browserName: "chromium", channel: "chrome" },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
