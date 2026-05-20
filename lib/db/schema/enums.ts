import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "tutor", "admin"]);

export const languageUiEnum = pgEnum("language_ui", ["vi", "en"]);

export const deckTypeEnum = pgEnum("deck_type", ["system", "personal", "cohort"]);

export const deckSourceEnum = pgEnum("deck_source", [
	"manual",
	"mock_test",
	"pdf_upload",
	"imported_apkg",
]);

export const cardTypeEnum = pgEnum("card_type", ["basic", "cloze"]);

export const qualityScoreEnum = pgEnum("quality_score", ["A", "B", "C", "needs_work"]);

export const reviewStateEnum = pgEnum("review_state", ["new", "learning", "review", "relearning"]);

export const reviewRatingEnum = pgEnum("review_rating", ["again", "hard", "good", "easy"]);

export const mockTestTypeEnum = pgEnum("mock_test_type", ["reading", "writing"]);

export const mockInputSourceEnum = pgEnum("mock_input_source", ["photo", "pdf", "manual_text"]);

export const cohortMemberStatusEnum = pgEnum("cohort_member_status", [
	"invited",
	"active",
	"paused",
	"completed",
	"left",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
	"free",
	"pro",
	"power",
	"tutor_lite",
	"tutor_pro",
	"beta",
]);

export const billingCycleEnum = pgEnum("billing_cycle", [
	"monthly",
	"annual",
	"lifetime",
	"free",
	"beta",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
	"active",
	"cancelled",
	"expired",
	"past_due",
	"beta",
]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
	"bug",
	"feature_request",
	"general",
	"praise",
	"complaint",
]);
