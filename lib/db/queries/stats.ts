import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reviewLogs, reviews } from "@/lib/db/schema";

/**
 * Retention analytics from review_logs.
 *
 * Headline metric is MEASURED retention = (good + easy) / total per ISO week
 * (locked decision 2026-05-29) — NOT the stored FSRS retrievability snapshot,
 * which decays and would mislead if charted as "retention".
 */

export type WeeklyRetention = {
	weekStart: string; // ISO date (Monday)
	total: number;
	recalled: number;
	retention: number; // 0..1
};

export async function getWeeklyRetention(userId: string, weeks = 8): Promise<WeeklyRetention[]> {
	const since = new Date();
	since.setUTCDate(since.getUTCDate() - weeks * 7);

	const rows = await db
		.select({
			week: sql<string>`to_char(date_trunc('week', ${reviewLogs.reviewedAt}), 'YYYY-MM-DD')`.as(
				"week",
			),
			total: count(),
			recalled:
				sql<number>`count(*) filter (where ${reviewLogs.rating} in ('good','easy'))`.mapWith(
					Number,
				),
		})
		.from(reviewLogs)
		.innerJoin(reviews, eq(reviewLogs.reviewId, reviews.id))
		.where(and(eq(reviews.userId, userId), gte(reviewLogs.reviewedAt, since)))
		.groupBy(sql`date_trunc('week', ${reviewLogs.reviewedAt})`)
		.orderBy(sql`date_trunc('week', ${reviewLogs.reviewedAt})`);

	return rows.map((r) => ({
		weekStart: r.week,
		total: r.total,
		recalled: r.recalled,
		retention: r.total > 0 ? r.recalled / r.total : 0,
	}));
}

export type ReviewSummary = { totalReviews: number; overallRetention: number };

/** All-time totals for the headline numbers. */
export async function getReviewSummary(userId: string): Promise<ReviewSummary> {
	const rows = await db
		.select({
			total: count(),
			recalled:
				sql<number>`count(*) filter (where ${reviewLogs.rating} in ('good','easy'))`.mapWith(
					Number,
				),
		})
		.from(reviewLogs)
		.innerJoin(reviews, eq(reviewLogs.reviewId, reviews.id))
		.where(eq(reviews.userId, userId));

	const row = rows[0];
	const total = row?.total ?? 0;
	const recalled = row?.recalled ?? 0;
	return { totalReviews: total, overallRetention: total > 0 ? recalled / total : 0 };
}
