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

/**
 * Claude Haiku 4.5 list pricing (May 2026) — used when the rate-limit fallback
 * routes a call to the premium provider. Materially higher than Gemini Flash, so
 * pricing the fallback path with Gemini numbers would under-report real spend
 * (~2-3x) on exactly the path the CLAUDE.md cost cap cares about.
 */
export const CLAUDE_HAIKU_PRICING = {
	inputUsdPerMillion: 1,
	outputUsdPerMillion: 5,
} as const;

type Usage = { inputTokens: number; outputTokens: number };

function costCents(
	usage: Usage,
	pricing: { inputUsdPerMillion: number; outputUsdPerMillion: number },
): number {
	const inputUsd = (usage.inputTokens / 1_000_000) * pricing.inputUsdPerMillion;
	const outputUsd = (usage.outputTokens / 1_000_000) * pricing.outputUsdPerMillion;
	return Math.ceil((inputUsd + outputUsd) * 100);
}

export function calculateGeminiCostCents(usage: Usage): number {
	return costCents(usage, GEMINI_FLASH_PRICING);
}

export function calculateClaudeCostCents(usage: Usage): number {
	return costCents(usage, CLAUDE_HAIKU_PRICING);
}

/**
 * Cost in cents priced by the provider that actually served the call. "fallback"
 * means the premium (Claude) provider handled it; everything else is Gemini.
 */
export function costCentsForProvider(
	provider: "primary" | "primary-retry" | "fallback",
	usage: Usage,
): number {
	return provider === "fallback"
		? calculateClaudeCostCents(usage)
		: calculateGeminiCostCents(usage);
}
