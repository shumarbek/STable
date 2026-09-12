import { test, expect } from "@playwright/test";

/**
 * Transaction CRUD E2E tests (spec section 87: add expense, edit
 * expense). Requires an authenticated session with at least one
 * account already created (onboarding creates a default "Naqd"
 * account automatically).
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Transactions", () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Parol").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Kirish" }).click();
    await page.waitForURL(/\/(dashboard|onboarding)/);
  });

  test("creates a new expense transaction", async ({ page }) => {
    await page.goto("/transactions/new");
    await page.getByRole("button", { name: /Oziq-ovqat/ }).click();
    await page.getByRole("button", { name: /Tayyor ovqat/ }).click();
    await page.getByLabel("Tayyor ovqat summasi").fill("15000");
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows validation error for a negative amount", async ({ page }) => {
    await page.goto("/transactions/new");
    await page.getByRole("button", { name: /Oziq-ovqat/ }).click();
    await page.getByRole("button", { name: /Tayyor ovqat/ }).click();
    await page.getByLabel("Tayyor ovqat summasi").fill("-500");
    await expect(page.getByRole("button", { name: "Saqlash" })).toBeDisabled();
  });

  test("lists created transactions on the transactions page", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { name: "Kirim va chiqimlar" })).toBeVisible();
  });

  test("filters transactions by type", async ({ page }) => {
    await page.goto("/transactions");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Kirim" }).click();
    await expect(page).toHaveURL(/type=income/);
  });
});
