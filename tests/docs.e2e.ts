import { expect, test } from "@playwright/test";

test("keeps documentation navigation and interactions usable", async ({ page }) => {
  await page.goto("/docs");

  await expect(
    page.getByRole("heading", { level: 1, name: "SF Tennis" }),
  ).toBeVisible();

  const fragmentTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")?.slice(1)),
  );
  expect(fragmentTargets.length).toBeGreaterThan(0);

  for (const target of new Set(fragmentTargets)) {
    expect(target).toBeTruthy();
    expect(
      await page.locator("[id]").evaluateAll(
        (elements, id) => elements.filter((element) => element.id === id).length,
        target,
      ),
      `#${target} should resolve to exactly one element`,
    ).toBe(1);
  }

  const themeToggle = page.getByRole("button", { name: "Switch to dark mode" });
  await expect(themeToggle).toBeVisible();
  await themeToggle.click();
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toBeVisible();
  await expect(page.locator("main").locator("..")).toHaveClass(/\bdark\b/);

  await page
    .getByRole("button", { name: /Find playable courts.*Open larger preview/ })
    .click();
  await expect(page.getByRole("dialog", { name: "Find playable courts preview" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
