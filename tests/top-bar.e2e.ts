import { expect, test } from "@playwright/test";

test("closes the menu when the page below the top bar is clicked", async ({
  page,
}) => {
  await page.route("**/api/courts?**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ courts: [], fetchedAt: null }),
    }),
  );
  await page.goto("/");

  await page.getByRole("button", { name: "Menu" }).click();
  const docsLink = page.getByRole("link", { name: "Docs" });
  await expect(docsLink).toBeVisible();

  await page.mouse.click(100, 500);

  await expect(docsLink).toHaveCount(0);

  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Docs" }).click();
  await expect(page).toHaveURL(/\/docs$/);
});
