/**
 * Cost calculation from Gemini usage tokens.
 *
 * Pricing per Gemini 2.5 Flash public list (May 2026):
 *   input  $0.30 / 1M tokens (image tokens are bundled into inputTokens by Gemini)
 *   output $2.50 / 1M tokens
 *
 * We store cents (integer) on `mock_tests.ai_cost_estimate_cents`. Always
 * round up so we never under-report. A 5000-input / 1000-output call lands at
 * 1 cent; we'd rather over-attribute by one penny than lose visibility into
 * many sub-cent calls.
 */

export const GEMINI_FLASH_PRICING = {
	inputUsdPerMillion: 0.3,
	outputUsdPerMillion: 2.5,
} as const;

export function calculateGeminiCostCents(usage: {
	inputTokens: number;
	outputTokens: number;
}): number {
	const inputUsd = (usage.inputTokens / 1_000_000) * GEMINI_FLASH_PRICING.inputUsdPerMillion;
	const outputUsd = (usage.outputTokens / 1_000_000) * GEMINI_FLASH_PRICING.outputUsdPerMillion;
	return Math.ceil((inputUsd + outputUsd) * 100);
}
