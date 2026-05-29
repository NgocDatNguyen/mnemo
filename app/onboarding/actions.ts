"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const OnboardingSchema = z.object({
	role: z.enum(["student", "tutor"]),
	currentBand: z.coerce.number().min(0).max(9),
	targetBand: z.coerce.number().min(0).max(9),
	examDate: z.string().optional(),
});

export type OnboardingResult =
	| { ok: true }
	| { ok: false; error: "UNAUTHORIZED" | "INVALID" | "INTERNAL" };

/**
 * Persist onboarding answers and stamp onboarding_completed_at, which lifts the
 * (app) layout gate. Band values validated to the IELTS 0-9 range; the card
 * generator consumes current/target band as its level hint.
 */
export async function saveOnboarding(input: unknown): Promise<OnboardingResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const parsed = OnboardingSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "INVALID" };

	const { role, currentBand, targetBand, examDate } = parsed.data;

	try {
		await db
			.update(users)
			.set({
				role,
				currentBand,
				targetBand,
				examDate: examDate ? new Date(examDate) : null,
				onboardingCompletedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));
		return { ok: true };
	} catch (err) {
		console.error("[saveOnboarding] failed", err);
		return { ok: false, error: "INTERNAL" };
	}
}
