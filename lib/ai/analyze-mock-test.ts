import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";
import type { MockTestQualityWarning } from "@/lib/db/types";
import { getObjectBytes } from "@/lib/r2/download";
import { calculateGeminiCostCents } from "./cost";
import { AI_PROVIDER_LABELS, models } from "./models";
import { buildAnalysisUserPrompt, SYSTEM_PROMPT } from "./prompts/mock-test-analysis";
import { AnalysisResultSchema } from "./schemas/weakness-clusters";

/**
 * Analyze one mock test end-to-end.
 *
 * Reads the R2 object referenced by the row, calls Gemini Vision with the
 * Zod-typed schema, writes the result back. Idempotent on success: returns
 * early if `analyzed_at` is already populated, so retries against an already-
 * complete row are cheap.
 *
 * On any failure (R2 fetch, Gemini call, validation), writes a single
 * `analysis_failed` entry to `quality_warnings`, leaves `analyzed_at` NULL,
 * and rethrows the original error. The retry path clears the warning before
 * re-attempting.
 */
export async function analyzeMockTest(testId: string): Promise<void> {
	const [test] = await db.select().from(mockTests).where(eq(mockTests.id, testId)).limit(1);
	if (!test) throw new Error(`mock_tests row ${testId} not found`);
	if (test.analyzedAt) return; // idempotent
	if (!test.rawInputUrl) throw new Error(`mock_tests row ${testId} has no rawInputUrl`);

	try {
		const bytes = await getObjectBytes(test.rawInputUrl);
		const mediaType = test.inputSource === "pdf" ? "application/pdf" : "image/jpeg";

		const userPart =
			test.inputSource === "pdf"
				? { type: "file" as const, data: bytes, mediaType }
				: { type: "image" as const, image: bytes, mediaType };

		const { object, usage } = await generateObject({
			model: models.vision,
			schema: AnalysisResultSchema,
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: buildAnalysisUserPrompt(test.testType) }, userPart],
				},
			],
		});

		const costCents = calculateGeminiCostCents({
			inputTokens: usage.inputTokens ?? 0,
			outputTokens: usage.outputTokens ?? 0,
		});

		await db
			.update(mockTests)
			.set({
				extractedText: object.extracted_text,
				weaknessClusters: object.weakness_clusters,
				qualityWarnings: object.quality_warnings,
				totalQuestions: object.total_questions,
				correctCount: object.correct_count,
				bandEstimate: object.band_estimate,
				aiProvider: AI_PROVIDER_LABELS.vision,
				aiCostEstimateCents: costCents,
				analyzedAt: new Date(),
			})
			.where(eq(mockTests.id, testId));

		await trackServerEvent({
			distinctId: test.userId,
			event: "mock_test_analyzed",
			properties: {
				test_type: test.testType,
				band_estimate: object.band_estimate,
				weakness_cluster_count: object.weakness_clusters.length,
				cost_cents: costCents,
				input_tokens: usage.inputTokens ?? 0,
				output_tokens: usage.outputTokens ?? 0,
			},
		});
	} catch (error) {
		const failure: MockTestQualityWarning = {
			type: "analysis_failed",
			message_vi: "Không thể phân tích bài thi. Vui lòng thử lại.",
		};
		await db
			.update(mockTests)
			.set({ qualityWarnings: [failure] })
			.where(eq(mockTests.id, testId));

		await trackServerEvent({
			distinctId: test.userId,
			event: "mock_test_analysis_failed",
			properties: {
				test_type: test.testType,
				error_message: error instanceof Error ? error.message : "unknown",
			},
		});

		throw error;
	}
}
