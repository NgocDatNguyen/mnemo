import { describe, expect, it } from "vitest";
import { calculateGeminiCostCents, GEMINI_FLASH_PRICING } from "@/lib/ai/cost";

describe("calculateGeminiCostCents", () => {
	it("returns 0 for zero usage", () => {
		expect(calculateGeminiCostCents({ inputTokens: 0, outputTokens: 0 })).toBe(0);
	});

	it("ceils sub-cent calls up to 1 cent", () => {
		// 100 input tokens = $0.00003; ceil(0.003 cents) = 1 cent
		expect(calculateGeminiCostCents({ inputTokens: 100, outputTokens: 0 })).toBe(1);
	});

	it("uses correct pricing for 1M input tokens", () => {
		// 1M input = $0.30 = 30 cents
		expect(calculateGeminiCostCents({ inputTokens: 1_000_000, outputTokens: 0 })).toBe(30);
	});

	it("uses correct pricing for 1M output tokens", () => {
		// 1M output = $2.50 = 250 cents
		expect(calculateGeminiCostCents({ inputTokens: 0, outputTokens: 1_000_000 })).toBe(250);
	});

	it("sums input + output costs", () => {
		// 1M input ($0.30) + 1M output ($2.50) = $2.80 = 280 cents
		expect(calculateGeminiCostCents({ inputTokens: 1_000_000, outputTokens: 1_000_000 })).toBe(280);
	});

	it("handles realistic mock-test analysis: 5000 input + 1500 output", () => {
		// 5000 * 0.30/1M = $0.0015
		// 1500 * 2.50/1M = $0.00375
		// total ≈ $0.00525 = 0.525 cents → ceil = 1 cent
		expect(calculateGeminiCostCents({ inputTokens: 5_000, outputTokens: 1_500 })).toBe(1);
	});

	it("exposes the pricing table for reference", () => {
		expect(GEMINI_FLASH_PRICING.inputUsdPerMillion).toBe(0.3);
		expect(GEMINI_FLASH_PRICING.outputUsdPerMillion).toBe(2.5);
	});
});
