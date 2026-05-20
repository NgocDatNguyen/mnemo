import { date, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Per-user usage counters per billing period. During beta we record but DO NOT enforce
 * (per CLAUDE.md "Beta Mode" — `Skip usage credit enforcement (track for analytics only)`).
 */
export const usageCredits = pgTable(
	"usage_credits",
	{
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		periodStart: date({ mode: "date" }).notNull(),
		mockTestsUsed: integer().notNull().default(0),
		cardsGenerated: integer().notNull().default(0),
		aiCostEstimateCents: integer().notNull().default(0),
	},
	(table) => [primaryKey({ columns: [table.userId, table.periodStart] })],
);

export type UsageCredit = typeof usageCredits.$inferSelect;
export type NewUsageCredit = typeof usageCredits.$inferInsert;
