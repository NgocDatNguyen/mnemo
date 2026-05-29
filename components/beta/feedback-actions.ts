"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { feedback } from "@/lib/db/schema";
import type { DeviceInfo } from "@/lib/db/types";

export type FeedbackResult =
	| { ok: true }
	| { ok: false; error: "UNAUTHORIZED" | "INVALID" | "INTERNAL" };

const FeedbackSchema = z.object({
	type: z.enum(["bug", "feature_request", "general", "praise", "complaint"]),
	message: z.string().trim().min(1).max(4000),
	pageUrl: z.string().max(500).optional(),
	deviceInfo: z
		.object({
			userAgent: z.string().optional(),
			viewport: z.object({ width: z.number(), height: z.number() }).optional(),
			platform: z.string().optional(),
		})
		.optional(),
});

/**
 * Beta feedback submission → feedback table. userId is always set for authed users
 * (the ON DELETE SET NULL on the column is only for anonymous survival).
 */
export async function submitFeedback(input: unknown): Promise<FeedbackResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const parsed = FeedbackSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "INVALID" };

	try {
		await db.insert(feedback).values({
			userId: session.user.id,
			type: parsed.data.type,
			message: parsed.data.message,
			pageUrl: parsed.data.pageUrl ?? null,
			deviceInfo: (parsed.data.deviceInfo ?? null) as DeviceInfo | null,
		});
		return { ok: true };
	} catch (err) {
		console.error("[submitFeedback] failed", err);
		return { ok: false, error: "INTERNAL" };
	}
}
