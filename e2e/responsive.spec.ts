import { test, expect } from "@playwright/test";

test.describe("Moslashuvchan sahifalar", () => {
  for (const route of ["/", "/login", "/signup"]) {
    test(`${route} sahifasida gorizontal toshib chiqish yo‘q`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow).toBe(false);
    });
  }
});
