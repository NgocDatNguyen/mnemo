import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Beta mode + access control helpers.
 *
 * `canAcceptNewUser` is consumed by `/waitlist` and the marketing landing page
 * to gate the signup CTA. The hard cap enforcement lives in the Better Auth
 * server hook (`lib/auth/server.ts` → databaseHooks.user.create.before), not here —
 * this is a UI-side check that the cap-aware-but-racy hook backs up server-side.
 *
 * `canAccessFeature` is the V2-shaped helper from CLAUDE.md "Beta Mode". During
 * beta, beta testers always pass. Post-beta, this will check subscription tier.
 */

export const BETA_MODE = process.env.BETA_MODE === "true";
export const BETA_USER_LIMIT = Number.parseInt(process.env.BETA_USER_LIMIT || "100", 10);

export async function getBetaUserCount(): Promise<number> {
	// Count the beta cohort specifically, not every row (admins / post-beta signups
	// with beta_tester=false must not consume beta slots). Uses idx_users_beta_tester.
	const result = await db.select({ value: count() }).from(users).where(eq(users.betaTester, true));
	return result[0]?.value ?? 0;
}

export async function canAcceptNewUser(): Promise<boolean> {
	if (!BETA_MODE) return true;
	const existing = await getBetaUserCount();
	return existing < BETA_USER_LIMIT;
}

export type FeatureKey = "mock_test" | "ai_generation" | "tutor_mode" | "anki_export";

export function canAccessFeature(
	user: { betaTester: boolean | null },
	_feature: FeatureKey,
): boolean {
	if (BETA_MODE && user.betaTester) return true;
	// TODO V2: replace with subscription-tier check
	// (see CLAUDE.md "Beta Mode" → "Schema notes for V2 readiness")
	return false;
}
