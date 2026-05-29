"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { scoreDeck } from "@/lib/ai/quality/engine";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { decks } from "@/lib/db/schema";

export type ScoreDeckResult =
	| { ok: true }
	| { ok: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL" };

/**
 * Manual re-score for a deck whose cards are unscored — the recovery path for when
 * background scoring (after() at generation time) never completed (next dev, eviction,
 * or a transient failure). Owner-scoped. Mirrors the analysis-retry pattern.
 */
export async function scoreDeckNow(deckId: string): Promise<ScoreDeckResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const [deck] = await db
		.select({ id: decks.id })
		.from(decks)
		.where(and(eq(decks.id, deckId), eq(decks.ownerId, session.user.id)))
		.limit(1);

	if (!deck) return { ok: false, error: "NOT_FOUND" };

	try {
		await scoreDeck(deckId, { distinctId: session.user.id });
		return { ok: true };
	} catch (err) {
		console.error("[scoreDeckNow] failed", err);
		return { ok: false, error: "INTERNAL" };
	}
}
