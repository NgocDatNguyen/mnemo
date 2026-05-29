import { z } from "zod";

/**
 * Schema for AI-generated flashcards. Validated before persistence so an SDK
 * regression can't write malformed cards.
 *
 * Decisions (CLAUDE.md log 2026-05-29): the model picks basic|cloze; cloze is
 * in-scope for v1; `source_reference` carries the originating cluster theme.
 * Target 10-30 cards with a floor of 10 — generateObject does not guarantee a
 * count, so the prompt steers and the action tolerates a partial set >= the floor.
 */
export const GeneratedCardSchema = z.object({
	type: z.enum(["basic", "cloze"]),
	front: z.string().min(1).max(500),
	back: z.string().min(1).max(500),
	context: z.string().max(500).optional(),
	source_reference: z.string().max(160).optional(),
});

export const CardGenerationSchema = z.object({
	cards: z.array(GeneratedCardSchema).min(1).max(40),
});

export type GeneratedCardPayload = z.infer<typeof GeneratedCardSchema>;
export type CardGenerationPayload = z.infer<typeof CardGenerationSchema>;

export const CARD_COUNT_FLOOR = 10;
export const CARD_COUNT_TARGET = 30;
