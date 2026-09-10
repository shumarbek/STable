import { test, expect } from "@playwright/test";

/**
 * Dashboard smoke tests (spec section 87).
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Dashboard", () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Parol").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Kirish" }).click();
    await page.waitForURL(/\/(dashboard|onboarding)/);
  });

  test("loads the dashboard and shows either the empty state or summary cards", async ({ page }) => {
    await page.goto("/dashboard");
    const emptyState = page.getByText("Hali hech qanday xarajat yo'q.");
    const balanceCard = page.getByText("Joriy balans");
    await expect(emptyState.or(balanceCard)).toBeVisible();
  });

  test("desktop sidebar navigation links are present", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Tranzaksiyalar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Taqvim" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hisobotlar" })).toBeVisible();
  });

  test("mobile bottom navigation is present on small viewports", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.getByLabel("Xarajat qo'shish")).toBeVisible();
  });
});
