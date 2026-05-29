import { type Grade, Rating, State } from "ts-fsrs";
import type { Review } from "@/lib/db/schema";

/**
 * Bidirectional mappers between ts-fsrs numeric enums and our Postgres string enums.
 * ts-fsrs: State New=0 Learning=1 Review=2 Relearning=3; Rating Again=1 Hard=2 Good=3 Easy=4.
 */

const STATE_TO_ENUM = {
	[State.New]: "new",
	[State.Learning]: "learning",
	[State.Review]: "review",
	[State.Relearning]: "relearning",
} as const satisfies Record<State, Review["state"]>;

const ENUM_TO_STATE = {
	new: State.New,
	learning: State.Learning,
	review: State.Review,
	relearning: State.Relearning,
} as const satisfies Record<Review["state"], State>;

const RATING_ENUM_TO_FSRS = {
	again: Rating.Again,
	hard: Rating.Hard,
	good: Rating.Good,
	easy: Rating.Easy,
} as const;

export type ReviewRating = keyof typeof RATING_ENUM_TO_FSRS;

export function stateToEnum(state: State): Review["state"] {
	return STATE_TO_ENUM[state as keyof typeof STATE_TO_ENUM];
}

export function enumToState(value: Review["state"]): State {
	return ENUM_TO_STATE[value];
}

export function ratingEnumToFsrs(rating: ReviewRating): Grade {
	return RATING_ENUM_TO_FSRS[rating];
}
