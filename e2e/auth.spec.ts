import { test, expect } from "@playwright/test";

/**
 * Auth flow E2E tests (spec section 87: signup, login).
 * Requires a running dev server with a real Supabase backend
 * (see e2e/README.md). Credentials come from environment variables,
 * never hardcoded.
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Landing and navigation", () => {
  test("shows the landing page with login/signup links for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Kirish" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ro'yxatdan o'tish" })).toBeVisible();
  });

  test("navigates to the login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Kirish" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Kirish" })).toBeVisible();
  });

  test("navigates to the signup page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ro'yxatdan o'tish" }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("redirects unauthenticated users away from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login", () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not configured");

  test("logs in with valid email/password credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Parol").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Kirish" }).click();
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Parol").fill("wrong-password-123");
    await page.getByRole("button", { name: "Kirish" }).click();
    await expect(page.getByText("Email yoki parol xato.")).toBeVisible();
  });
});
