import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockTestCard } from "@/components/mock-tests/mock-test-card";
import type { MockTest } from "@/lib/db/schema/mock-tests";

const base: MockTest = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	userId: "u1",
	testType: "reading",
	inputSource: "photo",
	rawInputUrl: "users/u1/mock-tests/550e8400-.../photo.jpg",
	extractedText: null,
	analyzedAt: null,
	weaknessClusters: null,
	qualityWarnings: null,
	generatedDeckId: null,
	totalQuestions: null,
	correctCount: null,
	bandEstimate: null,
	aiProvider: null,
	aiCostEstimateCents: null,
	createdAt: new Date("2026-05-20T07:33:00Z"),
};

describe("MockTestCard", () => {
	it("renders the test type label", () => {
		render(<MockTestCard test={base} />);
		expect(screen.getByText("Reading")).toBeInTheDocument();
	});

	it("shows 'Chưa phân tích' status when analyzedAt is null", () => {
		render(<MockTestCard test={base} />);
		expect(screen.getByText(/chưa phân tích/i)).toBeInTheDocument();
	});

	it("shows 'Đã phân tích' status when analyzedAt is set", () => {
		render(<MockTestCard test={{ ...base, analyzedAt: new Date() }} />);
		expect(screen.getByText(/đã phân tích/i)).toBeInTheDocument();
	});

	it("renders 'Ảnh' source label for photo input", () => {
		render(<MockTestCard test={base} />);
		expect(screen.getByText(/ảnh/i)).toBeInTheDocument();
	});

	it("renders 'PDF' source label for pdf input", () => {
		render(<MockTestCard test={{ ...base, inputSource: "pdf" }} />);
		expect(screen.getByText(/pdf/i)).toBeInTheDocument();
	});

	it("links to /mock-tests/[id]", () => {
		render(<MockTestCard test={base} />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", `/mock-tests/${base.id}`);
	});

	it("renders Writing label when testType is writing", () => {
		render(<MockTestCard test={{ ...base, testType: "writing" }} />);
		expect(screen.getByText("Writing")).toBeInTheDocument();
	});
});
