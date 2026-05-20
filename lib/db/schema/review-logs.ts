import { index, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { reviewRatingEnum } from "./enums";
import { reviews } from "./reviews";

/**
 * Append-only audit trail of every FSRS review rating. Drives retention analytics
 * and lets us replay/retune FSRS parameters later (Phase 2 — Vietnamese learner tuning).
 */
export const reviewLogs = pgTable(
	"review_logs",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		reviewId: uuid()
			.notNull()
			.references(() => reviews.id, { onDelete: "cascade" }),
		rating: reviewRatingEnum().notNull(),
		reviewedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		elapsedDays: numeric({ mode: "number" }).notNull(),
		scheduledDays: numeric({ mode: "number" }).notNull(),
	},
	(table) => [index("idx_review_logs_review_id_reviewed_at").on(table.reviewId, table.reviewedAt)],
);

export type ReviewLog = typeof reviewLogs.$inferSelect;
export type NewReviewLog = typeof reviewLogs.$inferInsert;
