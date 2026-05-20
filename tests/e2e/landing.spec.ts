import { expect, test } from "@playwright/test";

test.skip("landing page renders — placeholder, enable in Session 4", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/Mnemo/);
});
