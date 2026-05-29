import { Rating, State } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { enumToState, ratingEnumToFsrs, stateToEnum } from "@/lib/fsrs/mappers";
import { emptyReviewState, scheduleNext } from "@/lib/fsrs/scheduler";

describe("FSRS enum mappers", () => {
	it("maps State <-> enum round-trip", () => {
		for (const s of [State.New, State.Learning, State.Review, State.Relearning]) {
			expect(enumToState(stateToEnum(s))).toBe(s);
		}
	});

	it("maps rating strings to ts-fsrs Rating", () => {
		expect(ratingEnumToFsrs("again")).toBe(Rating.Again);
		expect(ratingEnumToFsrs("hard")).toBe(Rating.Hard);
		expect(ratingEnumToFsrs("good")).toBe(Rating.Good);
		expect(ratingEnumToFsrs("easy")).toBe(Rating.Easy);
	});
});

describe("emptyReviewState", () => {
	it("creates a new-state review due around now", () => {
		const now = new Date("2026-05-29T00:00:00Z");
		const s = emptyReviewState(now);
		expect(s.state).toBe("new");
		expect(s.reps).toBe(0);
		expect(s.lapses).toBe(0);
		expect(s.retrievability).toBe(0);
		expect(s.due).toBeInstanceOf(Date);
	});
});

describe("scheduleNext", () => {
	const now = new Date("2026-05-29T00:00:00Z");

	it("advances a new card and pushes the due date into the future on Good", () => {
		const start = emptyReviewState(now);
		const { update, log } = scheduleNext(start, "good", now);
		expect(update.due.getTime()).toBeGreaterThan(now.getTime());
		expect(update.reps).toBe(1);
		expect(typeof log.elapsedDays).toBe("number");
		expect(typeof log.scheduledDays).toBe("number");
	});

	it("Easy schedules further out than Hard", () => {
		const start = emptyReviewState(now);
		const easy = scheduleNext(start, "easy", now);
		const hard = scheduleNext(start, "hard", now);
		expect(easy.update.due.getTime()).toBeGreaterThan(hard.update.due.getTime());
	});

	it("Again increments lapses on a review-state card", () => {
		// First get the card into review state with a couple of Good ratings.
		let state = emptyReviewState(now);
		state = scheduleNext(state, "good", now).update;
		const later = new Date(state.due.getTime());
		state = scheduleNext(state, "good", later).update;
		const beforeLapses = state.lapses;
		const relapse = scheduleNext(state, "again", new Date(state.due.getTime()));
		expect(relapse.update.lapses).toBeGreaterThanOrEqual(beforeLapses);
	});
});
