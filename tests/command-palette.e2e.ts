import { expect, test } from "@playwright/test";

test("keeps keyboard focus inside the command palette", async ({ page }) => {
  await page.route("**/api/courts?**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ courts: [], fetchedAt: null }),
    }),
  );
  await page.goto("/");
  const opener = page.locator('button[aria-label="Search courts"]:visible');
  await opener.click();

  const dialog = page.getByRole("dialog", {
    name: "Search and filter courts",
  });
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  const visibleControls = dialog.locator("button:visible, input:visible");
  const first = visibleControls.first();
  const last = visibleControls.last();

  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(opener).toBeFocused();
});
