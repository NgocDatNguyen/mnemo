import {
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { WeaknessCluster } from "../types";
import { mockInputSourceEnum, mockTestTypeEnum } from "./enums";
import { users } from "./users";

/**
 * Note: `generatedDeckId` references decks.id at the ORM level (see relations.ts)
 * but has no DB FK constraint to avoid the decks ↔ mock_tests circular dep.
 * No `updated_at` per CLAUDE.md spec — mock tests are immutable once analyzed.
 */
export const mockTests = pgTable(
	"mock_tests",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		testType: mockTestTypeEnum().notNull(),
		inputSource: mockInputSourceEnum().notNull(),
		rawInputUrl: text(),
		extractedText: text(),
		analyzedAt: timestamp({ withTimezone: true, mode: "date" }),
		weaknessClusters: jsonb().$type<WeaknessCluster[]>(),
		generatedDeckId: uuid(),
		totalQuestions: integer(),
		correctCount: integer(),
		bandEstimate: numeric({ precision: 2, scale: 1, mode: "number" }),
		aiProvider: text(),
		aiCostEstimateCents: integer(),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
	},
	(table) => [index("idx_mock_tests_user_id_created_at").on(table.userId, table.createdAt)],
);

export type MockTest = typeof mockTests.$inferSelect;
export type NewMockTest = typeof mockTests.$inferInsert;
