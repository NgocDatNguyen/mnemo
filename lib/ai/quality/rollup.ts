import type { Card } from "@/lib/db/schema";
import type { QualityWarning } from "@/lib/db/types";

/**
 * Quality score rollup (CLAUDE.md + locked decision 2026-05-29):
 * start at A; each high-severity warning drops 1 grade, each medium drops 0.5,
 * round down. Additionally, >= 2 high-severity warnings => needs_work outright.
 */
const GRADES: NonNullable<Card["qualityScore"]>[] = ["A", "B", "C", "needs_work"];

export function rollupGrade(warnings: QualityWarning[]): NonNullable<Card["qualityScore"]> {
	const highCount = warnings.filter((w) => w.severity === "high").length;
	if (highCount >= 2) return "needs_work";

	const penalty = warnings.reduce((sum, w) => {
		if (w.severity === "high") return sum + 1;
		if (w.severity === "medium") return sum + 0.5;
		return sum;
	}, 0);

	const index = Math.min(Math.floor(penalty), GRADES.length - 1);
	return GRADES[index] ?? "needs_work";
}
