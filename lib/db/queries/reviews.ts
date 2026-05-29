import { and, asc, count, eq, lte } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/lib/db/client";
import type { Card } from "@/lib/db/schema";
import { cards, reviewLogs, reviews } from "@/lib/db/schema";
import { type ReviewRating, scheduleNext } from "@/lib/fsrs";

type PgBatch = [BatchItem<"pg">, ...BatchItem<"pg">[]];

export type DueCard = {
	reviewId: string;
	cardId: string;
	front: string;
	back: string;
	context: string | null;
	type: Card["type"];
};

/** Cards due now for a user, oldest-due first. Uses idx_reviews_user_id_due. */
export async function getDueCards(userId: string, limit = 20): Promise<DueCard[]> {
	const now = new Date();
	const rows = await db
		.select({
			reviewId: reviews.id,
			cardId: cards.id,
			front: cards.front,
			back: cards.back,
			context: cards.context,
			type: cards.type,
		})
		.from(reviews)
		.innerJoin(cards, eq(reviews.cardId, cards.id))
		.where(and(eq(reviews.userId, userId), lte(reviews.due, now)))
		.orderBy(asc(reviews.due))
		.limit(limit);
	return rows;
}

/** Count of cards due now (for the dashboard "due today" surface). Scalar count —
 * no row cap, no join to card text. */
export async function getDueCount(userId: string): Promise<number> {
	const now = new Date();
	const rows = await db
		.select({ n: count() })
		.from(reviews)
		.where(and(eq(reviews.userId, userId), lte(reviews.due, now)));
	return rows[0]?.n ?? 0;
}

export type RecordReviewResult = { ok: true } | { ok: false; error: "NOT_FOUND" };

/**
 * Apply a rating to a (user, card) review: compute the next FSRS state and, in one
 * atomic batch, update the reviews row AND append a review_logs row. Owner-scoped via
 * the reviews.userId predicate so a user can only rate their own reviews.
 */
export async function recordReview(
	userId: string,
	cardId: string,
	rating: ReviewRating,
): Promise<RecordReviewResult> {
	const [row] = await db
		.select()
		.from(reviews)
		.where(and(eq(reviews.userId, userId), eq(reviews.cardId, cardId)))
		.limit(1);

	if (!row) return { ok: false, error: "NOT_FOUND" };

	const { update, log } = scheduleNext(row, rating, new Date());

	await db.batch([
		db.update(reviews).set(update).where(eq(reviews.id, row.id)),
		db.insert(reviewLogs).values({
			reviewId: row.id,
			rating,
			elapsedDays: log.elapsedDays,
			scheduledDays: log.scheduledDays,
		}),
	] as PgBatch);

	return { ok: true };
}
