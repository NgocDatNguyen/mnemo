import { generateObject } from "ai";
import { z } from "zod";
import type { QualityWarning } from "@/lib/db/types";
import { calculateGeminiCostCents } from "../cost";
import { models } from "../models";
import { withGeminiFallback } from "../with-fallback";
import type { ScorableCard } from "./rules";

/**
 * LLM-classified Quality rules 1 (atomicity) + 3 (disambiguation), batched into a
 * SINGLE Flash-Lite call per deck (locked decision — avoid one call per card).
 *
 * Best-effort by design: NO Claude fallback is configured. Flash-Lite is the
 * cheapest model and these two rules are non-critical, so on a 429 the call
 * retries once then throws — scoreCards catches it and scores on the deterministic
 * rules alone. Routing a cheap classification to the paid premium model isn't worth
 * the cost; graceful degradation to deterministic-only is the intended behavior.
 */

const ClassificationSchema = z.object({
	cards: z.array(
		z.object({
			index: z.number().int().nonnegative(),
			atomic: z.boolean(),
			ambiguous: z.boolean(),
		}),
	),
});

const SYSTEM = `Bạn là bộ kiểm tra chất lượng flashcard. Với mỗi thẻ, đánh giá 2 tiêu chí:
- atomic: thẻ chỉ test ĐÚNG MỘT đơn vị kiến thức (true) hay nhồi nhiều ý (false).
- ambiguous: câu hỏi mơ hồ, có thể có nhiều đáp án đúng khác nhau (true) hay rõ ràng (false).
Trả về đúng một mục cho mỗi thẻ theo index đã cho. Không giải thích.`;

export type ClassificationResult = Map<number, { atomic: boolean; ambiguous: boolean }>;

export async function classifyCards(
	cards: ScorableCard[],
	distinctId?: string,
): Promise<{ map: ClassificationResult; costCents: number }> {
	const list = cards
		.map((c, i) => `[${i}] (${c.type}) FRONT: ${c.front}\n    BACK: ${c.back}`)
		.join("\n");

	const { value } = await withGeminiFallback(
		(model) =>
			generateObject({
				model,
				schema: ClassificationSchema,
				system: SYSTEM,
				prompt: `Đánh giá ${cards.length} thẻ sau:\n\n${list}`,
			}),
		{ primary: models.classification, distinctId, stage: "quality_classify" },
	);

	const map: ClassificationResult = new Map();
	for (const r of value.object.cards)
		map.set(r.index, { atomic: r.atomic, ambiguous: r.ambiguous });

	// Observability: a partial response means some cards score as "clean" on rules
	// 1+3 by default (optimistic). Surface it rather than silently over-grading.
	if (map.size !== cards.length) {
		console.warn(
			`[quality] classification covered ${map.size}/${cards.length} cards; missing ones scored deterministically only`,
		);
	}

	const costCents = calculateGeminiCostCents({
		inputTokens: value.usage.inputTokens ?? 0,
		outputTokens: value.usage.outputTokens ?? 0,
	});
	return { map, costCents };
}

/** Convert a classification result for one card into warnings (rules 1 + 3). */
export function classificationWarnings(c?: {
	atomic: boolean;
	ambiguous: boolean;
}): QualityWarning[] {
	if (!c) return [];
	const warnings: QualityWarning[] = [];
	if (!c.atomic) {
		warnings.push({
			rule: "atomicity",
			severity: "high",
			message: "Card may test more than one fact. Consider splitting.",
		});
	}
	if (c.ambiguous) {
		warnings.push({
			rule: "disambiguation",
			severity: "medium",
			message: "Question may be ambiguous — more than one answer could fit.",
		});
	}
	return warnings;
}
