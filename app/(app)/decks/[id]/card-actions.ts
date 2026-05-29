"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rescoreCard } from "@/lib/ai/quality/engine";
import { auth } from "@/lib/auth/server";
import { updateCard } from "@/lib/db/queries";

export type EditCardResult =
	| { ok: true }
	| { ok: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "INVALID" | "INTERNAL" };

const EditSchema = z.object({
	type: z.enum(["basic", "cloze"]),
	front: z.string().trim().min(1).max(500),
	back: z.string().trim().min(1).max(500),
	context: z.string().trim().max(500).optional(),
});

/**
 * Edit a card (owner-scoped via updateCard's deck-join check) and re-score it.
 * Re-scoring is best-effort — an edit still succeeds even if scoring fails.
 */
export async function editCard(cardId: string, input: unknown): Promise<EditCardResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const parsed = EditSchema.safeParse(input);
	if (!parsed.success) return { ok: false, error: "INVALID" };

	const updated = await updateCard(cardId, session.user.id, {
		type: parsed.data.type,
		front: parsed.data.front,
		back: parsed.data.back,
		context: parsed.data.context ?? null,
	});
	if (!updated) return { ok: false, error: "NOT_FOUND" };

	try {
		await rescoreCard(cardId, { distinctId: session.user.id });
	} catch (err) {
		console.error("[editCard] rescore failed (non-blocking)", err);
	}

	return { ok: true };
}
