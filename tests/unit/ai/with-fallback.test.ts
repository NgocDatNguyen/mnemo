import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for lib/ai/with-fallback.ts — the 429 retry → Claude Haiku fallback path.
 * trackServerEvent is mocked so we can assert the rate-limit events without PostHog.
 */

const captured: { events: { event: string; properties?: Record<string, unknown> }[] } = {
	events: [],
};

beforeEach(() => {
	vi.resetModules();
	captured.events = [];
	vi.doMock("@/lib/analytics/posthog-server", () => ({
		trackServerEvent: async (p: { event: string; properties?: Record<string, unknown> }) => {
			captured.events.push({ event: p.event, properties: p.properties });
		},
	}));
});

afterEach(() => {
	vi.doUnmock("@/lib/analytics/posthog-server");
});

function rateLimitError() {
	return new Error("429 Too Many Requests: resource exhausted");
}

const PRIMARY = "primary-model" as never;
const FALLBACK = "fallback-model" as never;

describe("withGeminiFallback", () => {
	it("returns primary result with no rate-limit events on success", async () => {
		const { withGeminiFallback } = await import("@/lib/ai/with-fallback");
		const op = vi.fn(async (m: unknown) => `ok:${String(m)}`);

		const { value, provider } = await withGeminiFallback(op, { primary: PRIMARY });

		expect(value).toBe("ok:primary-model");
		expect(provider).toBe("primary");
		expect(op).toHaveBeenCalledTimes(1);
		expect(captured.events).toHaveLength(0);
	});

	it("retries the primary once after a 429, then succeeds", async () => {
		const { withGeminiFallback } = await import("@/lib/ai/with-fallback");
		let calls = 0;
		const op = vi.fn(async () => {
			calls++;
			if (calls === 1) throw rateLimitError();
			return "recovered";
		});

		const { value, provider } = await withGeminiFallback(op, {
			primary: PRIMARY,
			fallback: FALLBACK,
			retryDelayMs: 0,
		});

		expect(value).toBe("recovered");
		expect(provider).toBe("primary-retry");
		expect(op).toHaveBeenCalledTimes(2);
		expect(captured.events.map((e) => e.event)).toEqual(["ai_rate_limited"]);
	});

	it("falls back to Claude when primary keeps rate-limiting", async () => {
		const { withGeminiFallback } = await import("@/lib/ai/with-fallback");
		const op = vi.fn(async (m: unknown) => {
			if (String(m) === "primary-model") throw rateLimitError();
			return "claude-result";
		});

		const { value, provider } = await withGeminiFallback(op, {
			primary: PRIMARY,
			fallback: FALLBACK,
			retryDelayMs: 0,
		});

		expect(value).toBe("claude-result");
		expect(provider).toBe("fallback");
		expect(op).toHaveBeenCalledTimes(3); // primary, primary-retry, fallback
		expect(captured.events).toHaveLength(2); // two rate-limit events
	});

	it("rethrows non-rate-limit errors immediately without retry", async () => {
		const { withGeminiFallback } = await import("@/lib/ai/with-fallback");
		const op = vi.fn(async () => {
			throw new Error("schema validation failed");
		});

		await expect(
			withGeminiFallback(op, { primary: PRIMARY, fallback: FALLBACK, retryDelayMs: 0 }),
		).rejects.toThrow(/schema validation/);
		expect(op).toHaveBeenCalledTimes(1);
		expect(captured.events).toHaveLength(0);
	});

	it("rethrows the 429 when no fallback is configured and retry also fails", async () => {
		const { withGeminiFallback } = await import("@/lib/ai/with-fallback");
		const op = vi.fn(async () => {
			throw rateLimitError();
		});

		await expect(withGeminiFallback(op, { primary: PRIMARY, retryDelayMs: 0 })).rejects.toThrow(
			/429/,
		);
		expect(op).toHaveBeenCalledTimes(2); // primary + one retry, no fallback
	});
});
