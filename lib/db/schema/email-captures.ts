import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const emailCaptures = pgTable("email_captures", {
	id: uuid()
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	email: text().notNull().unique(),
	source: text().notNull(),
	notes: text(),
	notifiedAt: timestamp({ withTimezone: true, mode: "date" }),
	createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export type EmailCapture = typeof emailCaptures.$inferSelect;
export type NewEmailCapture = typeof emailCaptures.$inferInsert;
