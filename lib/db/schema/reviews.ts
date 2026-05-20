import { index, integer, numeric, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { cards } from "./cards";
import { reviewStateEnum } from "./enums";
import { users } from "./users";

/**
 * Current FSRS state for a (user, card) pair. One row per user per card.
 * FSRS-5 fields (stability, difficulty, retrievability) stored as `numeric`
 * per CLAUDE.md spec; Drizzle `mode: "number"` returns JS numbers on read.
 */
export const reviews = pgTable(
	"reviews",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		cardId: uuid()
			.notNull()
			.references(() => cards.id, { onDelete: "cascade" }),
		stability: numeric({ mode: "number" }).notNull(),
		difficulty: numeric({ mode: "number" }).notNull(),
		retrievability: numeric({ mode: "number" }).notNull(),
		state: reviewStateEnum().notNull().default("new"),
		due: timestamp({ withTimezone: true, mode: "date" }).notNull(),
		lastReview: timestamp({ withTimezone: true, mode: "date" }),
		lapses: integer().notNull().default(0),
		reps: integer().notNull().default(0),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique("uq_reviews_user_card").on(table.userId, table.cardId),
		index("idx_reviews_user_id_due").on(table.userId, table.due),
	],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
