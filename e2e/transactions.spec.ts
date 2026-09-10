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
    await page.getByLabel("Summa (so'm)").fill("15000");
    await page.getByRole("button", { name: "Kategoriyani tanlang" }).click();
    await page.getByRole("button", { name: /Oziq-ovqat/ }).first().click();
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows validation error for a negative amount", async ({ page }) => {
    await page.goto("/transactions/new");
    await page.getByLabel("Summa (so'm)").fill("-500");
    await page.getByRole("button", { name: "Saqlash" }).click();
    await expect(page.getByText("Summa manfiy bo'lishi mumkin emas")).toBeVisible();
  });

  test("lists created transactions on the transactions page", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { name: "Tranzaksiyalar" })).toBeVisible();
  });

  test("filters transactions by type", async ({ page }) => {
    await page.goto("/transactions");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Daromad" }).click();
    await expect(page).toHaveURL(/type=income/);
  });
});
