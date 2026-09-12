import { expect, test } from "@playwright/test";

test("keeps keyboard focus inside the command palette", async ({ page }) => {
  await page.route("**/api/courts?**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ courts: [], fetchedAt: null }),
    }),
  );
  await page.goto("/");
  await page.locator('button[aria-label="Search courts"]:visible').click();

  const dialog = page.getByRole("dialog", {
    name: "Search and filter courts",
  });
  await expect(dialog).toBeVisible();

  const visibleControls = dialog.locator("button:visible, input:visible");
  const first = visibleControls.first();
  const last = visibleControls.last();

  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
});
