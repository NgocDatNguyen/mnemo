import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeaknessDisplay } from "@/components/mock-tests/weakness-display";
import type { MockTest } from "@/lib/db/schema/mock-tests";
import type { MockTestQualityWarning, WeaknessCluster } from "@/lib/db/types";

const grammarCluster: WeaknessCluster = {
	type: "grammar",
	theme: "Inversion structures",
	severity: "major",
	examples: [
		{
			user_error: "barely had I left",
			correction: "no sooner had I left",
			explanation_vi: "Cấu trúc đảo ngữ với 'no sooner' đi kèm 'than'.",
		},
	],
	suggested_practice_vi: "Ôn các cấu trúc đảo ngữ.",
};

const vocabCluster: WeaknessCluster = {
	type: "vocabulary",
	theme: "Academic synonyms",
	severity: "minor",
	examples: [
		{
			user_error: "very important",
			correction: "crucial",
			explanation_vi: "Trong văn cảnh học thuật, dùng 'crucial' thay vì 'very important'.",
		},
	],
	suggested_practice_vi: "Học bảng từ đồng nghĩa học thuật.",
};

const baseTest: MockTest = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	userId: "u1",
	testType: "reading",
	inputSource: "photo",
	rawInputUrl: "users/u1/...",
	extractedText: "Q1. A...",
	analyzedAt: new Date("2026-05-20T08:00:00Z"),
	weaknessClusters: [grammarCluster, vocabCluster],
	qualityWarnings: null,
	generatedDeckId: null,
	totalQuestions: 13,
	correctCount: 8,
	bandEstimate: 6.5,
	aiProvider: "gemini-2.5-flash",
	aiCostEstimateCents: 1,
	createdAt: new Date("2026-05-20T07:33:00Z"),
};

describe("WeaknessDisplay", () => {
	it("renders all cluster themes", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText("Inversion structures")).toBeInTheDocument();
		expect(screen.getByText("Academic synonyms")).toBeInTheDocument();
	});

	it("renders Vietnamese type labels", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText("Ngữ pháp")).toBeInTheDocument();
		expect(screen.getByText("Từ vựng")).toBeInTheDocument();
	});

	it("renders Vietnamese severity badges", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText("Nghiêm trọng")).toBeInTheDocument();
		expect(screen.getByText("Nhẹ")).toBeInTheDocument();
	});

	it("renders band estimate formatted to one decimal", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText("6.5")).toBeInTheDocument();
	});

	it("shows fallback when band_estimate is null", () => {
		render(<WeaknessDisplay test={{ ...baseTest, bandEstimate: null }} />);
		expect(screen.getByText(/chưa đủ dữ liệu/i)).toBeInTheDocument();
	});

	it("renders user_error and correction from examples", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText("barely had I left")).toBeInTheDocument();
		expect(screen.getByText("no sooner had I left")).toBeInTheDocument();
	});

	it("renders Vietnamese explanation text", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText(/cấu trúc đảo ngữ với/i)).toBeInTheDocument();
	});

	it("renders suggested practice text", () => {
		render(<WeaknessDisplay test={baseTest} />);
		expect(screen.getByText(/ôn các cấu trúc đảo ngữ/i)).toBeInTheDocument();
	});

	it("renders detection-time quality warnings", () => {
		const warnings: MockTestQualityWarning[] = [
			{ type: "low_image_quality", message_vi: "Vùng phải bị mờ." },
		];
		render(<WeaknessDisplay test={{ ...baseTest, qualityWarnings: warnings }} />);
		expect(screen.getByText(/lưu ý về chất lượng/i)).toBeInTheDocument();
		expect(screen.getByText(/ảnh chất lượng thấp/i)).toBeInTheDocument();
		expect(screen.getByText(/vùng phải bị mờ/i)).toBeInTheDocument();
	});

	it("hides the warnings card when only analysis_failed is present", () => {
		const warnings: MockTestQualityWarning[] = [{ type: "analysis_failed", message_vi: "x" }];
		render(<WeaknessDisplay test={{ ...baseTest, qualityWarnings: warnings }} />);
		expect(screen.queryByText(/lưu ý về chất lượng/i)).not.toBeInTheDocument();
	});

	it("renders the disabled Session 8 CTA preview", () => {
		render(<WeaknessDisplay test={baseTest} />);
		const cta = screen.getByRole("button", { name: /tạo flashcard.+sắp ra mắt/i });
		expect(cta).toBeDisabled();
	});
});
