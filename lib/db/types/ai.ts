/**
 * JSONB payload shapes for AI-produced data stored in the database.
 *
 * These types are referenced by Drizzle column definitions via `$type<>()`
 * to give us typed reads/writes without runtime validation. Validate at the
 * boundary (server actions / API routes) with Zod before persisting.
 */

export type WeaknessCluster = {
	/** Free-form taxonomy from the AI — e.g. "collocations", "subject-verb agreement". */
	category: string;
	/** Drives prioritization in card generation and UI sort order. */
	severity: "low" | "medium" | "high";
	/** Question identifiers from the mock test that exhibited this weakness. */
	affected_questions: string[];
	/** Concrete wrong/correct pairs the AI extracted for card seeding. */
	examples: {
		wrong: string;
		correct: string;
		sentence: string;
	}[];
};

/**
 * One warning attached to a card by the Quality Engine.
 *
 * `rule` and `severity` match CLAUDE.md "Quality Engine — 5 rules":
 *  - atomicity (high), reading_load (medium), disambiguation (medium),
 *    cloze_placement (high), interference (low or medium)
 */
export type QualityWarning = {
	rule: "atomicity" | "reading_load" | "disambiguation" | "cloze_placement" | "interference";
	message: string;
	severity: "low" | "medium" | "high";
};
