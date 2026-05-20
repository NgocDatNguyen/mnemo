import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { QualityWarning } from "../types";
import { decks } from "./decks";
import { cardTypeEnum, qualityScoreEnum } from "./enums";

export const cards = pgTable(
	"cards",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		deckId: uuid()
			.notNull()
			.references(() => decks.id, { onDelete: "cascade" }),
		type: cardTypeEnum().notNull(),
		front: text().notNull(),
		back: text().notNull(),
		context: text(),
		sourceReference: text(),
		qualityScore: qualityScoreEnum(),
		qualityWarnings: jsonb().$type<QualityWarning[]>(),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_cards_deck_id").on(table.deckId)],
);

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
