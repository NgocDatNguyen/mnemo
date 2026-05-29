import { and, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/lib/db/client";
import type { Card } from "@/lib/db/schema";
import { cards, decks } from "@/lib/db/schema";
import type { CardInput } from "./decks";

type PgBatch = [BatchItem<"pg">, ...BatchItem<"pg">[]];

/**
 * Insert one card into a deck and bump `decks.cardCount` atomically (one batch).
 * Returns the new card id.
 */
export async function insertCard(deckId: string, input: CardInput): Promise<string> {
	const [row] = await db.batch([
		db
			.insert(cards)
			.values({ ...input, deckId })
			.returning({ id: cards.id }),
		db
			.update(decks)
			.set({ cardCount: sql`${decks.cardCount} + 1` })
			.where(eq(decks.id, deckId)),
	] as PgBatch);

	const inserted = (row as { id: string }[])[0];
	if (!inserted) throw new Error("insertCard: insert returned no row");
	return inserted.id;
}

/**
 * Delete a card and decrement `decks.cardCount` atomically. No-op (returns false) if
 * the card does not exist. cardCount is floored at 0 to guard against drift.
 */
export async function deleteCard(cardId: string): Promise<boolean> {
	const existing = await db
		.select({ deckId: cards.deckId })
		.from(cards)
		.where(eq(cards.id, cardId))
		.limit(1);

	const deckId = existing[0]?.deckId;
	if (!deckId) return false;

	await db.batch([
		db.delete(cards).where(eq(cards.id, cardId)),
		db
			.update(decks)
			.set({ cardCount: sql`greatest(${decks.cardCount} - 1, 0)` })
			.where(eq(decks.id, deckId)),
	] as PgBatch);

	return true;
}

/**
 * Update editable card fields (front/back/context/type/sourceReference and quality
 * results). Scoped so only a card whose deck the user owns can be updated. Returns
 * the updated card or null if not found / not owned.
 */
export async function updateCard(
	cardId: string,
	userId: string,
	patch: Partial<CardInput>,
): Promise<Card | null> {
	// Ownership check via deck join — no existence leak across users.
	const owned = await db
		.select({ id: cards.id })
		.from(cards)
		.innerJoin(decks, eq(cards.deckId, decks.id))
		.where(and(eq(cards.id, cardId), eq(decks.ownerId, userId)))
		.limit(1);

	if (!owned[0]) return null;

	const [updated] = await db.update(cards).set(patch).where(eq(cards.id, cardId)).returning();

	return updated ?? null;
}
