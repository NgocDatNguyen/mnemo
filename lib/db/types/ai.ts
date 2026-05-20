/**
 * JSONB payload shapes for AI-produced data stored in the database.
 *
 * These types are referenced by Drizzle column definitions via `$type<>()`
 * to give us typed reads/writes without runtime validation. Validate at the
 * boundary (server actions / API routes) with Zod before persisting.
 */

/**
 * One weakness pattern surfaced by Gemini Vision when analyzing a mock test.
 *
 * `type` partitions clusters in the UI. Reading-only types: `reading_skill`.
 * Writing-only: `writing_skill`, `task_response`. Shared: vocabulary, grammar,
 * collocation. Severity maps to the user-facing badge color.
 */
export type WeaknessCluster = {
	type:
		| "vocabulary"
		| "grammar"
		| "collocation"
		| "reading_skill"
		| "writing_skill"
		| "task_response";
	/** Short human label, e.g. "Inversion structures", "Article usage". */
	theme: string;
	severity: "minor" | "moderate" | "major";
	examples: {
		user_error: string;
		correction: string;
		explanation_vi: string;
	}[];
	suggested_practice_vi: string;
};

/**
 * Warning attached to a mock test row by the analyzer.
 *
 * Detection-time types are written by Gemini when it sees a degraded input
 * (e.g. blurry photo). `analysis_failed` is reserved for our own error handler
 * and is the signal the UI uses to render the retry button.
 */
export type MockTestQualityWarning = {
	type:
		| "low_image_quality"
		| "partial_answers"
		| "ambiguous_handwriting"
		| "language_mismatch"
		| "analysis_failed";
	message_vi: string;
};

/**
 * One warning attached to a card by the Quality Engine.
 *
 * Distinct from `MockTestQualityWarning` — different table, different rules
 * (CLAUDE.md "Quality Engine — 5 rules"). Used by the cards.quality_warnings
 * column.
 */
export type QualityWarning = {
	rule: "atomicity" | "reading_load" | "disambiguation" | "cloze_placement" | "interference";
	message: string;
	severity: "low" | "medium" | "high";
};
