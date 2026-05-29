import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { usageCredits } from "@/lib/db/schema";

/**
 * Track-not-enforce usage recorder (CLAUDE.md "Beta Mode" — record usage, don't
 * enforce limits). Upserts the current-period (calendar month, UTC) usage_credits
 * row, incrementing the given counters.
 *
 * BEST-EFFORT: never throws. This runs on the hot AI path and analytics must never
 * block or fail a user-facing operation. Errors are logged and swallowed.
 */

function currentPeriodStart(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function recordUsage(
	userId: string,
	delta: { mockTestsUsed?: number; cardsGenerated?: number; aiCostCents?: number },
): Promise<void> {
	const mockTestsUsed = delta.mockTestsUsed ?? 0;
	const cardsGenerated = delta.cardsGenerated ?? 0;
	const aiCostCents = delta.aiCostCents ?? 0;

	try {
		await db
			.insert(usageCredits)
			.values({
				userId,
				periodStart: currentPeriodStart(),
				mockTestsUsed,
				cardsGenerated,
				aiCostEstimateCents: aiCostCents,
			})
			.onConflictDoUpdate({
				target: [usageCredits.userId, usageCredits.periodStart],
				set: {
					mockTestsUsed: sql`${usageCredits.mockTestsUsed} + ${mockTestsUsed}`,
					cardsGenerated: sql`${usageCredits.cardsGenerated} + ${cardsGenerated}`,
					aiCostEstimateCents: sql`${usageCredits.aiCostEstimateCents} + ${aiCostCents}`,
				},
			});
	} catch (err) {
		console.error("[recordUsage] non-blocking failure", err);
	}
}
