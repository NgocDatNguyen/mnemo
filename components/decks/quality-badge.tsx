import type { Card } from "@/lib/db/schema";
import { copy } from "@/lib/i18n/copy";

/**
 * Quality-grade chip using the locked --color-quality-* tokens. Renders nothing
 * when a card has no score yet (cards land unscored until the Quality Engine runs
 * in roadmap step 5). "needs_work" is shown plainly, never softened, per the
 * CLAUDE.md hard rule against celebrating low-quality cards.
 */
const STYLES: Record<NonNullable<Card["qualityScore"]>, string> = {
	A: "bg-quality-a-bg text-quality-a",
	B: "bg-quality-b-bg text-quality-b",
	C: "bg-quality-c-bg text-quality-c",
	needs_work: "bg-quality-needswork-bg text-quality-needswork",
};

export function QualityBadge({ score }: { score: Card["qualityScore"] }) {
	if (!score) return null;
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[score]}`}
		>
			{copy.decks.quality[score]}
		</span>
	);
}
