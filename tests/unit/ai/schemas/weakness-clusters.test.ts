import { describe, expect, it } from "vitest";
import { AnalysisResultSchema, WeaknessClusterSchema } from "@/lib/ai/schemas/weakness-clusters";

const sampleCluster = {
	type: "grammar",
	theme: "Inversion structures",
	severity: "moderate",
	examples: [
		{
			user_error: "barely had I left",
			correction: "no sooner had I left",
			explanation_vi: "Cấu trúc đảo ngữ với 'no sooner' đi kèm 'than'.",
		},
	],
	suggested_practice_vi: "Ôn các cấu trúc đảo ngữ thông dụng.",
};

const sampleResult = {
	test_type_confirmed: "reading",
	total_questions: 13,
	correct_count: 8,
	band_estimate: 6.5,
	extracted_text: "Q1. A\nQ2. C\n...",
	weakness_clusters: [sampleCluster],
	quality_warnings: [],
};

describe("WeaknessClusterSchema", () => {
	it("accepts a well-formed cluster", () => {
		expect(WeaknessClusterSchema.safeParse(sampleCluster).success).toBe(true);
	});

	it("rejects unknown cluster type", () => {
		expect(WeaknessClusterSchema.safeParse({ ...sampleCluster, type: "spelling" }).success).toBe(
			false,
		);
	});

	it("rejects unknown severity", () => {
		expect(
			WeaknessClusterSchema.safeParse({ ...sampleCluster, severity: "critical" }).success,
		).toBe(false);
	});

	it("rejects empty examples array", () => {
		expect(WeaknessClusterSchema.safeParse({ ...sampleCluster, examples: [] }).success).toBe(false);
	});

	it("rejects more than 5 examples", () => {
		const tooMany = Array.from({ length: 6 }, () => sampleCluster.examples[0]);
		expect(WeaknessClusterSchema.safeParse({ ...sampleCluster, examples: tooMany }).success).toBe(
			false,
		);
	});

	it("rejects example missing explanation_vi", () => {
		expect(
			WeaknessClusterSchema.safeParse({
				...sampleCluster,
				examples: [{ user_error: "x", correction: "y" }],
			}).success,
		).toBe(false);
	});

	it("rejects empty theme", () => {
		expect(WeaknessClusterSchema.safeParse({ ...sampleCluster, theme: "" }).success).toBe(false);
	});

	it("accepts all six allowed types", () => {
		const types = [
			"vocabulary",
			"grammar",
			"collocation",
			"reading_skill",
			"writing_skill",
			"task_response",
		];
		for (const type of types) {
			expect(WeaknessClusterSchema.safeParse({ ...sampleCluster, type }).success).toBe(true);
		}
	});
});

describe("AnalysisResultSchema", () => {
	it("accepts a well-formed result", () => {
		expect(AnalysisResultSchema.safeParse(sampleResult).success).toBe(true);
	});

	it("allows null band_estimate", () => {
		expect(AnalysisResultSchema.safeParse({ ...sampleResult, band_estimate: null }).success).toBe(
			true,
		);
	});

	it("rejects band_estimate above 9", () => {
		expect(AnalysisResultSchema.safeParse({ ...sampleResult, band_estimate: 9.5 }).success).toBe(
			false,
		);
	});

	it("rejects negative total_questions", () => {
		expect(AnalysisResultSchema.safeParse({ ...sampleResult, total_questions: -1 }).success).toBe(
			false,
		);
	});

	it("rejects empty weakness_clusters", () => {
		expect(AnalysisResultSchema.safeParse({ ...sampleResult, weakness_clusters: [] }).success).toBe(
			false,
		);
	});

	it("rejects more than 8 weakness_clusters", () => {
		const many = Array.from({ length: 9 }, () => sampleCluster);
		expect(
			AnalysisResultSchema.safeParse({ ...sampleResult, weakness_clusters: many }).success,
		).toBe(false);
	});

	it("defaults quality_warnings to empty array when omitted", () => {
		const { quality_warnings: _omit, ...without } = sampleResult;
		const parsed = AnalysisResultSchema.parse(without);
		expect(parsed.quality_warnings).toEqual([]);
	});

	it("rejects analysis_failed in detection-time quality_warnings", () => {
		// `analysis_failed` is reserved for our error handler — Gemini must not
		// emit it. The schema rejects it from the model output.
		expect(
			AnalysisResultSchema.safeParse({
				...sampleResult,
				quality_warnings: [{ type: "analysis_failed", message_vi: "x" }],
			}).success,
		).toBe(false);
	});

	it("accepts all four detection-time quality warning types", () => {
		const types = [
			"low_image_quality",
			"partial_answers",
			"ambiguous_handwriting",
			"language_mismatch",
		];
		for (const type of types) {
			expect(
				AnalysisResultSchema.safeParse({
					...sampleResult,
					quality_warnings: [{ type, message_vi: "x" }],
				}).success,
			).toBe(true);
		}
	});
});
