import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { cohorts } from "./cohorts";
import { deckSourceEnum, deckTypeEnum } from "./enums";
import { users } from "./users";

/**
 * Note: `sourceMockTestId` references mock_tests.id at the ORM level (see relations.ts)
 * but has no DB FK constraint to avoid the decks ↔ mock_tests circular dep.
 * App-level enforcement is acceptable for the MVP — both ends are nullable metadata links.
 */
export const decks = pgTable(
	"decks",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		ownerId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		cohortId: uuid().references(() => cohorts.id, { onDelete: "set null" }),
		title: text().notNull(),
		description: text(),
		type: deckTypeEnum().notNull(),
		source: deckSourceEnum().notNull(),
		sourceMockTestId: uuid(),
		cardCount: integer().notNull().default(0),
		isPublic: boolean().notNull().default(false),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_decks_owner_id").on(table.ownerId),
		index("idx_decks_cohort_id").on(table.cohortId),
		index("idx_decks_source_mock_test_id").on(table.sourceMockTestId),
	],
);

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
