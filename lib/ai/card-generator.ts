import { generateObject } from "ai";
import type { WeaknessCluster } from "@/lib/db/types";
import { costCentsForProvider } from "./cost";
import { models } from "./models";
import { buildCardGenPrompt, CARD_GEN_SYSTEM_PROMPT } from "./prompts/card-generation";
import { type CardGenerationPayload, CardGenerationSchema } from "./schemas/cards";
import { type FallbackProvider, withGeminiFallback } from "./with-fallback";

/**
 * Generate flashcards from a mock test's weakness clusters.
 *
 * Pure AI step — no DB writes here (the caller persists via createDeckWithCards
 * so the deck + cards land atomically). Wrapped in withGeminiFallback for 429
 * resilience. Returns cards plus cost + provider so the caller attributes usage.
 */
export async function generateCardsFromWeakness(
	clusters: WeaknessCluster[],
	level: { current: number; target: number },
	opts: { distinctId?: string } = {},
): Promise<{
	cards: CardGenerationPayload["cards"];
	costCents: number;
	provider: FallbackProvider;
}> {
	const { value, provider } = await withGeminiFallback(
		(model) =>
			generateObject({
				model,
				schema: CardGenerationSchema,
				system: CARD_GEN_SYSTEM_PROMPT,
				prompt: buildCardGenPrompt(clusters, level),
			}),
		{
			primary: models.generation,
			fallback: models.premium,
			distinctId: opts.distinctId,
			stage: "card_generation",
		},
	);

	const costCents = costCentsForProvider(provider, {
		inputTokens: value.usage.inputTokens ?? 0,
		outputTokens: value.usage.outputTokens ?? 0,
	});

	return { cards: value.object.cards, costCents, provider };
}
