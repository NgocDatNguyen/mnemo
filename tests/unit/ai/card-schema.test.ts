import { describe, expect, it } from "vitest";
import {
	CARD_COUNT_FLOOR,
	CARD_COUNT_TARGET,
	CardGenerationSchema,
	GeneratedCardSchema,
} from "@/lib/ai/schemas/cards";

describe("GeneratedCardSchema", () => {
	it("accepts a valid basic card", () => {
		const r = GeneratedCardSchema.safeParse({
			type: "basic",
			front: "synonym of 'increase'",
			back: "rise / grow",
			context: "Prices rose sharply.",
			source_reference: "vocabulary: trend verbs",
		});
		expect(r.success).toBe(true);
	});

	it("accepts a cloze card without optional fields", () => {
		const r = GeneratedCardSchema.safeParse({
			type: "cloze",
			front: "Prices {{c1::rose}} sharply last year.",
			back: "rose",
		});
		expect(r.success).toBe(true);
	});

	it("rejects an unknown card type", () => {
		const r = GeneratedCardSchema.safeParse({ type: "image", front: "x", back: "y" });
		expect(r.success).toBe(false);
	});

	it("rejects an empty front", () => {
		const r = GeneratedCardSchema.safeParse({ type: "basic", front: "", back: "y" });
		expect(r.success).toBe(false);
	});
});

describe("CardGenerationSchema", () => {
	it("accepts a batch of cards", () => {
		const cards = Array.from({ length: 12 }, (_, i) => ({
			type: "basic" as const,
			front: `q${i}`,
			back: `a${i}`,
		}));
		const r = CardGenerationSchema.safeParse({ cards });
		expect(r.success).toBe(true);
	});

	it("rejects an empty card array", () => {
		const r = CardGenerationSchema.safeParse({ cards: [] });
		expect(r.success).toBe(false);
	});

	it("exposes a 10-30 count target", () => {
		expect(CARD_COUNT_FLOOR).toBe(10);
		expect(CARD_COUNT_TARGET).toBe(30);
	});
});
