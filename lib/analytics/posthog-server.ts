import { PostHog } from "posthog-node";

/**
 * Server-side PostHog event capture.
 *
 * In Vercel serverless, the process may freeze between invocations so we shut
 * the client down after each call to force a flush. Latency cost is ~100-200ms,
 * acceptable on routes that already do I/O. If the key is missing (local dev
 * without analytics), this is a no-op.
 */
export async function trackServerEvent(params: {
	distinctId: string;
	event: string;
	properties?: Record<string, unknown>;
}): Promise<void> {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
	if (!key) return;

	const client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
	try {
		client.capture({
			distinctId: params.distinctId,
			event: params.event,
			properties: params.properties,
		});
	} finally {
		await client.shutdown();
	}
}
