"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { recordReview } from "@/lib/db/queries";
import type { ReviewRating } from "@/lib/fsrs";

export type RateResult =
	| { ok: true }
	| { ok: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL" };

const VALID_RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];

/**
 * Apply an FSRS rating to a card the current user is reviewing. Owner-scoped in
 * recordReview (reviews.userId predicate). Validates the rating against the enum
 * so a crafted client payload can't write garbage.
 */
export async function rateCard(cardId: string, rating: string): Promise<RateResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	if (!VALID_RATINGS.includes(rating as ReviewRating)) {
		return { ok: false, error: "INTERNAL" };
	}

	try {
		const result = await recordReview(session.user.id, cardId, rating as ReviewRating);
		return result.ok ? { ok: true } : { ok: false, error: "NOT_FOUND" };
	} catch (err) {
		console.error("[rateCard] failed", err);
		return { ok: false, error: "INTERNAL" };
	}
}
