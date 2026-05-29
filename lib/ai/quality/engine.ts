import { and, eq, ne } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/lib/db/client";
import { recordUsage } from "@/lib/db/queries";
import type { Card } from "@/lib/db/schema";
import { cards as cardsTable } from "@/lib/db/schema";
import type { QualityWarning } from "@/lib/db/types";
import { classificationWarnings, classifyCards } from "./classify";
import { rollupGrade } from "./rollup";
import { ruleClozePlacement, ruleInterference, ruleReadingLoad, type ScorableCard } from "./rules";

export type ScoredCard = {
	qualityScore: NonNullable<Card["qualityScore"]>;
	qualityWarnings: QualityWarning[];
};

/**
 * Score a set of cards across all 5 rules. Deterministic rules (2 reading load,
 * 4 cloze, 5 interference) always run. LLM rules (1 atomicity, 3 disambiguation)
 * are best-effort: if the Flash-Lite batch fails, scoring proceeds on the
 * deterministic rules alone rather than failing the whole pass.
 */
export async function scoreCards(
	cards: ScorableCard[],
	opts: { distinctId?: string } = {},
): Promise<{ scored: ScoredCard[]; costCents: number }> {
	const interference = ruleInterference(cards);

	let classification: Awaited<ReturnType<typeof classifyCards>> | null = null;
	try {
		classification = await classifyCards(cards, opts.distinctId);
	} catch (err) {
		console.error("[quality] classification failed; deterministic rules only", err);
	}

	const scored = cards.map((card, i) => {
		const warnings: QualityWarning[] = [
			...ruleReadingLoad(card),
			...ruleClozePlacement(card),
			...(interference[i] ?? []),
			...classificationWarnings(classification?.map.get(i)),
		];
		return { qualityScore: rollupGrade(warnings), qualityWarnings: warnings };
	});

	return { scored, costCents: classification?.costCents ?? 0 };
}

/**
 * Score every card in a deck and persist results. Designed to run in the background
 * via `after()` after card generation. Best-effort: a failure here never affects the
 * already-committed deck/cards.
 */
export async function scoreDeck(deckId: string, opts: { distinctId?: string } = {}): Promise<void> {
	const rows = await db
		.select({
			id: cardsTable.id,
			type: cardsTable.type,
			front: cardsTable.front,
			back: cardsTable.back,
		})
		.from(cardsTable)
		.where(eq(cardsTable.deckId, deckId));

	if (rows.length === 0) return;

	const { scored, costCents } = await scoreCards(rows, opts);

	const statements: BatchItem<"pg">[] = rows.map((row, i) =>
		db
			.update(cardsTable)
			.set({
				qualityScore: scored[i]?.qualityScore ?? null,
				qualityWarnings: scored[i]?.qualityWarnings ?? [],
			})
			.where(eq(cardsTable.id, row.id)),
	);

	await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

	// Track the Flash-Lite classification spend (best-effort, never throws).
	if (opts.distinctId && costCents > 0) {
		await recordUsage(opts.distinctId, { aiCostCents: costCents });
	}
}

/**
 * Re-score a single card after an edit. Cheaper than scoreDeck: interference is
 * computed deterministically against deck siblings, and only the edited card is
 * sent to Flash-Lite (one tiny classification call). Best-effort.
 */
export async function rescoreCard(
	cardId: string,
	opts: { distinctId?: string } = {},
): Promise<void> {
	const [card] = await db
		.select({
			id: cardsTable.id,
			deckId: cardsTable.deckId,
			type: cardsTable.type,
			front: cardsTable.front,
			back: cardsTable.back,
		})
		.from(cardsTable)
		.where(eq(cardsTable.id, cardId))
		.limit(1);
	if (!card) return;

	const siblings = await db
		.select({ type: cardsTable.type, front: cardsTable.front, back: cardsTable.back })
		.from(cardsTable)
		.where(and(eq(cardsTable.deckId, card.deckId), ne(cardsTable.id, cardId)));

	// Edited card at index 0 so we can read its interference result directly.
	const interference = ruleInterference([card, ...siblings])[0] ?? [];

	let classification: Awaited<ReturnType<typeof classifyCards>> | null = null;
	try {
		classification = await classifyCards([card], opts.distinctId);
	} catch (err) {
		console.error("[quality] single-card classification failed; deterministic only", err);
	}

	const warnings: QualityWarning[] = [
		...ruleReadingLoad(card),
		...ruleClozePlacement(card),
		...interference,
		...classificationWarnings(classification?.map.get(0)),
	];

	await db
		.update(cardsTable)
		.set({ qualityScore: rollupGrade(warnings), qualityWarnings: warnings })
		.where(eq(cardsTable.id, cardId));

	if (opts.distinctId && (classification?.costCents ?? 0) > 0) {
		await recordUsage(opts.distinctId, { aiCostCents: classification?.costCents ?? 0 });
	}
}
