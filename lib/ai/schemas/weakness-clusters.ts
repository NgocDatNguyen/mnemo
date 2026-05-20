import { z } from "zod";

/**
 * Schema for one weakness cluster surfaced by the analyzer. Matches the
 * `WeaknessCluster` DB type in lib/db/types/ai.ts — we validate Gemini's
 * raw output against this before persisting, so a runtime SDK regression
 * can't poison the JSONB column.
 */
export const WeaknessClusterSchema = z.object({
	type: z.enum([
		"vocabulary",
		"grammar",
		"collocation",
		"reading_skill",
		"writing_skill",
		"task_response",
	]),
	theme: z.string().min(1).max(120),
	severity: z.enum(["minor", "moderate", "major"]),
	examples: z
		.array(
			z.object({
				user_error: z.string(),
				correction: z.string(),
				explanation_vi: z.string(),
			}),
		)
		.min(1)
		.max(5),
	suggested_practice_vi: z.string(),
});

export type WeaknessClusterPayload = z.infer<typeof WeaknessClusterSchema>;

/**
 * The detection-time quality warning types — written by Gemini when it sees
 * a degraded input. `analysis_failed` is reserved for our error handler and
 * is intentionally absent from this enum so the model can't claim its own
 * failure as a quality issue.
 */
export const GeminiQualityWarningSchema = z.object({
	type: z.enum([
		"low_image_quality",
		"partial_answers",
		"ambiguous_handwriting",
		"language_mismatch",
	]),
	message_vi: z.string(),
});

/**
 * Top-level analysis result from one Gemini call.
 *
 * `total_questions` is 0 when undetectable (blank Writing essays, partial
 * Reading photos). `band_estimate` is `null` when there's not enough signal.
 */
export const AnalysisResultSchema = z.object({
	test_type_confirmed: z.enum(["reading", "writing"]),
	total_questions: z.number().int().nonnegative(),
	correct_count: z.number().int().nonnegative(),
	band_estimate: z.number().min(0).max(9).nullable(),
	extracted_text: z.string(),
	weakness_clusters: z.array(WeaknessClusterSchema).min(1).max(8),
	quality_warnings: z.array(GeminiQualityWarningSchema).default([]),
});

export type AnalysisResultPayload = z.infer<typeof AnalysisResultSchema>;
