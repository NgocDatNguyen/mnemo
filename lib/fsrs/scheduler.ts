import { createEmptyCard, type Card as FsrsCard, fsrs, generatorParameters } from "ts-fsrs";
import type { Review } from "@/lib/db/schema";
import { enumToState, type ReviewRating, ratingEnumToFsrs, stateToEnum } from "./mappers";

/**
 * Configured FSRS-5 scheduler.
 *
 * Decisions (CLAUDE.md log 2026-05-29): default FSRS-5 params, request_retention
 * 0.9, fuzz OFF. Short-term scheduler is also OFF so `learning_steps` is never
 * used — this keeps the reviews table free of a learning_steps column. Phase 2
 * will tune params for Vietnamese learners.
 */
export const scheduler = fsrs(
	generatorParameters({
		request_retention: 0.9,
		enable_fuzz: false,
		enable_short_term: false,
	}),
);

export type ReviewStateColumns = Pick<
	Review,
	"stability" | "difficulty" | "retrievability" | "state" | "due" | "lastReview" | "lapses" | "reps"
>;

export type ReviewLogPayload = { elapsedDays: number; scheduledDays: number };

/** Initial FSRS state for a brand-new (user, card) pair. retrievability starts at 0
 * (no history); stats use review_logs measured retention, not this snapshot column. */
export function emptyReviewState(now: Date): ReviewStateColumns {
	return fsrsCardToColumns(createEmptyCard(now), 0);
}

/**
 * Advance a review by a rating. Returns the new state columns + a review-log payload
 * (elapsed/scheduled days come straight from ts-fsrs — never invented).
 */
export function scheduleNext(
	row: ReviewStateColumns,
	rating: ReviewRating,
	now: Date,
): { update: ReviewStateColumns; log: ReviewLogPayload } {
	const { card: nextCard, log } = scheduler.next(
		columnsToFsrsCard(row),
		now,
		ratingEnumToFsrs(rating),
	);
	return {
		update: fsrsCardToColumns(nextCard, 0),
		log: { elapsedDays: log.elapsed_days, scheduledDays: log.scheduled_days },
	};
}

function fsrsCardToColumns(card: FsrsCard, retrievability: number): ReviewStateColumns {
	return {
		stability: card.stability,
		difficulty: card.difficulty,
		retrievability,
		state: stateToEnum(card.state),
		due: card.due,
		lastReview: card.last_review ?? null,
		lapses: card.lapses,
		reps: card.reps,
	};
}

function columnsToFsrsCard(row: ReviewStateColumns): FsrsCard {
	return {
		due: row.due,
		stability: row.stability,
		difficulty: row.difficulty,
		elapsed_days: 0, // recomputed by ts-fsrs from last_review + now
		scheduled_days: 0,
		reps: row.reps,
		lapses: row.lapses,
		learning_steps: 0, // short-term scheduler disabled
		state: enumToState(row.state),
		last_review: row.lastReview ?? undefined,
	};
}
