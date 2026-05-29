"use server";

import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { after } from "next/server";
import { uuidv7 } from "uuidv7";
import { generateCardsFromWeakness } from "@/lib/ai/card-generator";
import { AI_PROVIDER_LABELS } from "@/lib/ai/models";
import { scoreDeck } from "@/lib/ai/quality/engine";
import { CARD_COUNT_FLOOR } from "@/lib/ai/schemas/cards";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { createDeckWithCards, recordUsage } from "@/lib/db/queries";
import { decks, mockTests, users } from "@/lib/db/schema";

export type GenerateCardsResult =
	| { ok: true; deckId: string; cardCount: number }
	| {
			ok: false;
			error: "UNAUTHORIZED" | "NOT_FOUND" | "NOT_ANALYZED" | "TOO_FEW" | "INTERNAL";
	  };

// Default level for the core ICP when onboarding data is absent (onboarding is
// roadmap step 9 — until then current_band/target_band are NULL).
const DEFAULT_LEVEL = { current: 6.5, target: 7.5 };

/** Best-effort analytics — must never turn a committed success into a failure. */
async function track(event: string, props: Record<string, unknown>) {
	try {
		await trackServerEvent({
			distinctId: String(props.user_id ?? "system"),
			event,
			properties: props,
		});
	} catch (err) {
		console.error(`[generateCards] analytics ${event} failed (non-blocking)`, err);
	}
}

/**
 * Generate a personalized deck from a mock test's weakness analysis.
 *
 * Idempotent + concurrency-safe: a guarded conditional UPDATE atomically *claims*
 * the mock test's generatedDeckId slot with a pre-minted deck id BEFORE the billable
 * AI call. Only the winner of that claim generates + persists; losers (double-click,
 * two tabs) return the existing deck. On any failure after claiming, the claim is
 * rolled back so the slot does not dangle. Owner-scoped throughout.
 */
export async function generateCards(testId: string): Promise<GenerateCardsResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };
	const userId = session.user.id;

	const [test] = await db
		.select()
		.from(mockTests)
		.where(and(eq(mockTests.id, testId), eq(mockTests.userId, userId)))
		.limit(1);

	if (!test) return { ok: false, error: "NOT_FOUND" };

	const clusters = test.weaknessClusters ?? [];
	if (!test.analyzedAt || clusters.length === 0) {
		return { ok: false, error: "NOT_ANALYZED" };
	}

	// Fast path: already generated.
	if (test.generatedDeckId) {
		return { ok: true, deckId: test.generatedDeckId, cardCount: 0 };
	}

	// Atomic claim: only one concurrent caller wins the IS NULL slot.
	const deckId = uuidv7();
	const claimed = await db
		.update(mockTests)
		.set({ generatedDeckId: deckId })
		.where(and(eq(mockTests.id, testId), isNull(mockTests.generatedDeckId)))
		.returning({ id: mockTests.id });

	if (claimed.length === 0) {
		// Lost the race — return the deck the winner created (re-read).
		const [fresh] = await db
			.select({ generatedDeckId: mockTests.generatedDeckId })
			.from(mockTests)
			.where(eq(mockTests.id, testId))
			.limit(1);
		return fresh?.generatedDeckId
			? { ok: true, deckId: fresh.generatedDeckId, cardCount: 0 }
			: { ok: false, error: "INTERNAL" };
	}

	// We own the claim. Roll it back on any downstream failure so the slot frees up.
	const releaseClaim = () =>
		db
			.update(mockTests)
			.set({ generatedDeckId: null })
			.where(and(eq(mockTests.id, testId), eq(mockTests.generatedDeckId, deckId)));

	try {
		const [user] = await db
			.select({ current: users.currentBand, target: users.targetBand })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		const level = {
			current: user?.current ?? DEFAULT_LEVEL.current,
			target: user?.target ?? DEFAULT_LEVEL.target,
		};

		const { cards, costCents, provider } = await generateCardsFromWeakness(clusters, level, {
			distinctId: userId,
		});
		const providerLabel =
			provider === "fallback" ? AI_PROVIDER_LABELS.premium : AI_PROVIDER_LABELS.generation;

		if (cards.length < CARD_COUNT_FLOOR) {
			// Cost was still incurred — keep telemetry complete — then free the slot.
			await recordUsage(userId, { aiCostCents: costCents });
			await track("cards_generation_too_few", {
				user_id: userId,
				mock_test_id: test.id,
				card_count: cards.length,
				cost_cents: costCents,
				ai_provider: providerLabel,
			});
			await releaseClaim();
			return { ok: false, error: "TOO_FEW" };
		}

		await createDeckWithCards({
			deckId, // pre-minted; slot already claimed
			ownerId: userId,
			title: `${test.testType === "reading" ? "Reading" : "Writing"} — ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(test.createdAt)}`,
			type: "personal",
			source: "mock_test",
			sourceMockTestId: test.id,
			backlinkMockTest: false, // claim already set generatedDeckId
			seedReviewsForUserId: userId, // seed FSRS state so cards are immediately reviewable
			cards: cards.map((c) => ({
				type: c.type,
				front: c.front,
				back: c.back,
				context: c.context ?? null,
				sourceReference: c.source_reference ?? null,
			})),
		});

		// Quality scoring runs in the background after the response — cards land
		// unscored and the badge fills in once scoring completes (best-effort).
		after(async () => {
			try {
				await scoreDeck(deckId, { distinctId: userId });
			} catch (err) {
				console.error("[generateCards] background scoreDeck failed", err);
			}
		});

		await recordUsage(userId, { cardsGenerated: cards.length, aiCostCents: costCents });
		await track("cards_generated", {
			user_id: userId,
			mock_test_id: test.id,
			deck_id: deckId,
			card_count: cards.length,
			cost_cents: costCents,
			ai_provider: providerLabel,
		});

		return { ok: true, deckId, cardCount: cards.length };
	} catch (err) {
		console.error("[generateCards] failed", err);
		// Free the claimed slot + best-effort delete a partial deck row.
		await releaseClaim().catch(() => {});
		await db
			.delete(decks)
			.where(eq(decks.id, deckId))
			.catch(() => {});
		return { ok: false, error: "INTERNAL" };
	}
}
