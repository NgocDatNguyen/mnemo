import { expect, test } from "@playwright/test";

/**
 * Unauthenticated smoke specs — runnable without a session or AI. Auth-gated flows
 * (magic-link sign-in, upload→analysis→cards, review) need a session stub + a
 * deployed preview and are tracked separately (see ci.yml e2e job notes).
 */

test("landing renders the brand hero", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/Mnemo/);
	await expect(page.getByText(/học một lần/)).toBeVisible();
	await expect(
		page.getByRole("link", { name: /tham gia beta|vào waitlist/i }).first(),
	).toBeVisible();
});

test("waitlist page loads", async ({ page }) => {
	await page.goto("/waitlist");
	await expect(page.getByRole("button", { name: /waitlist/i })).toBeVisible();
});

test("protected app route redirects unauthenticated users to /login", async ({ page }) => {
	await page.goto("/dashboard");
	await expect(page).toHaveURL(/\/login/);
});

test("privacy page discloses Gemini data usage", async ({ page }) => {
	await page.goto("/privacy");
	await expect(page.getByText(/Gemini/)).toBeVisible();
});
