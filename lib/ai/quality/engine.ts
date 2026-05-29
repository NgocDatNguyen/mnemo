import { eq } from "drizzle-orm";
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
