import { APICallError, type LanguageModel } from "ai";
import { trackServerEvent } from "@/lib/analytics/posthog-server";

/**
 * Resilient AI call wrapper per CLAUDE.md "AI providers" → "Fallback for rate limits":
 * on a Gemini 429, retry once after ~5s, then fall back to the premium model
 * (Claude Haiku). Every rate-limit event is logged to PostHog for monitoring.
 *
 * The operation receives the model to use so the same generateObject/generateText
 * call can run against either provider — the Vercel AI SDK keeps the Zod schema
 * contract identical across vendors.
 *
 * Returns which provider ultimately served the call so callers can attribute cost
 * and set the `ai_provider` telemetry label correctly.
 */

export type FallbackProvider = "primary" | "primary-retry" | "fallback";

function isRateLimit(err: unknown): boolean {
	if (APICallError.isInstance(err)) {
		return err.statusCode === 429 || err.isRetryable === true;
	}
	return /\b429\b|rate.?limit|quota|resource.?exhausted/i.test(
		err instanceof Error ? err.message : String(err),
	);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withGeminiFallback<T>(
	operation: (model: LanguageModel) => Promise<T>,
	opts: {
		primary: LanguageModel;
		fallback?: LanguageModel;
		distinctId?: string;
		retryDelayMs?: number;
		stage?: string;
	},
): Promise<{ value: T; provider: FallbackProvider }> {
	const retryDelayMs = opts.retryDelayMs ?? 5000;

	try {
		return { value: await operation(opts.primary), provider: "primary" };
	} catch (err) {
		if (!isRateLimit(err)) throw err;

		await trackServerEvent({
			distinctId: opts.distinctId ?? "system",
			event: "ai_rate_limited",
			properties: { stage: opts.stage ?? "unknown", attempt: "primary" },
		});

		await sleep(retryDelayMs);

		try {
			return { value: await operation(opts.primary), provider: "primary-retry" };
		} catch (retryErr) {
			if (!isRateLimit(retryErr) || !opts.fallback) throw retryErr;

			await trackServerEvent({
				distinctId: opts.distinctId ?? "system",
				event: "ai_rate_limited",
				properties: { stage: opts.stage ?? "unknown", attempt: "fallback" },
			});

			return { value: await operation(opts.fallback), provider: "fallback" };
		}
	}
}
