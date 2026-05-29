import { and, desc, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { uuidv7 } from "uuidv7";
import { db } from "@/lib/db/client";
import type { Card, Deck } from "@/lib/db/schema";
import { cards, decks, mockTests, reviews } from "@/lib/db/schema";
import { emptyReviewState } from "@/lib/fsrs";

/**
 * Centralized deck/card write layer.
 *
 * IMPORTANT: the neon-http driver does NOT support interactive `db.transaction()`
 * (verified: throws "No transactions support in neon-http driver"). It DOES support
 * `db.batch([...])`, which runs all statements in a single server-side transaction
 * (all-or-nothing). Because UUIDv7 ids are generated in JS (`uuidv7()`), we know the
 * deck id before inserting cards, so a batch covers create-deck + insert-cards +
 * backlink in one atomic round-trip. Keep ALL multi-row writes flowing through
 * these helpers so `decks.cardCount` never drifts.
 */

type PgBatch = [BatchItem<"pg">, ...BatchItem<"pg">[]];

export type CardInput = {
	type: Card["type"];
	front: string;
	back: string;
	context?: string | null;
	sourceReference?: string | null;
	qualityScore?: Card["qualityScore"];
	qualityWarnings?: Card["qualityWarnings"];
};

export type CreateDeckWithCardsInput = {
	/** Pre-minted deck id. When omitted, one is generated. Pass this when the caller
	 * has already claimed an idempotency slot referencing the deck id. */
	deckId?: string;
	ownerId: string;
	title: string;
	description?: string | null;
	type: Deck["type"];
	source: Deck["source"];
	sourceMockTestId?: string | null;
	cohortId?: string | null;
	/** Update mockTests.generatedDeckId to point at this deck. Default true. Set false
	 * when the caller already set the backlink (e.g. an atomic claim before generation). */
	backlinkMockTest?: boolean;
	/** When set, seed a `reviews` row (FSRS state=new) for this user per card, in the
	 * same batch — so the due queue is non-empty as soon as the deck exists. */
	seedReviewsForUserId?: string;
	cards: CardInput[];
};

/**
 * Atomically create a deck and its cards, with `cardCount` set to the card count and
 * (when `sourceMockTestId` is given and `backlinkMockTest !== false`) the mock test
 * back-linked to this deck. Optionally seeds FSRS review rows. Returns the deck id.
 * One `db.batch` — partial failure rolls back.
 */
export async function createDeckWithCards(input: CreateDeckWithCardsInput): Promise<string> {
	const deckId = input.deckId ?? uuidv7();
	// Pre-mint card ids so we can seed reviews referencing them in the same batch.
	const cardRows = input.cards.map((c) => ({ ...c, id: uuidv7(), deckId }));

	const statements: BatchItem<"pg">[] = [
		db.insert(decks).values({
			id: deckId,
			ownerId: input.ownerId,
			title: input.title,
			description: input.description ?? null,
			type: input.type,
			source: input.source,
			sourceMockTestId: input.sourceMockTestId ?? null,
			cohortId: input.cohortId ?? null,
			cardCount: cardRows.length,
		}),
	];

	if (cardRows.length > 0) {
		statements.push(db.insert(cards).values(cardRows));

		if (input.seedReviewsForUserId) {
			const userId = input.seedReviewsForUserId;
			const now = new Date();
			const reviewRows = cardRows.map((c) => ({
				userId,
				cardId: c.id,
				...emptyReviewState(now),
			}));
			statements.push(db.insert(reviews).values(reviewRows));
		}
	}

	if (input.sourceMockTestId && input.backlinkMockTest !== false) {
		statements.push(
			db
				.update(mockTests)
				.set({ generatedDeckId: deckId })
				.where(eq(mockTests.id, input.sourceMockTestId)),
		);
	}

	await db.batch(statements as PgBatch);
	return deckId;
}

/** All decks owned by a user, newest first. */
export async function listDecksByOwner(userId: string): Promise<Deck[]> {
	return db.select().from(decks).where(eq(decks.ownerId, userId)).orderBy(desc(decks.createdAt));
}

/**
 * A single deck plus its cards, scoped to the owner. Returns null if the deck does
 * not exist OR is not owned by `userId` (no existence leak across users).
 */
export async function getDeckWithCards(
	deckId: string,
	userId: string,
): Promise<{ deck: Deck; cards: Card[] } | null> {
	const rows = await db
		.select()
		.from(decks)
		.where(and(eq(decks.id, deckId), eq(decks.ownerId, userId)))
		.limit(1);

	const deck = rows[0];
	if (!deck) return null;

	const deckCards = await db
		.select()
		.from(cards)
		.where(eq(cards.deckId, deckId))
		.orderBy(cards.createdAt);

	return { deck, cards: deckCards };
}
