import { boolean, date, index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./users";

export const cohorts = pgTable(
	"cohorts",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		tutorId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text().notNull(),
		targetBand: numeric({ precision: 2, scale: 1, mode: "number" }),
		examDate: date({ mode: "date" }),
		inviteToken: text().notNull().unique(),
		isActive: boolean().notNull().default(true),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		archivedAt: timestamp({ withTimezone: true, mode: "date" }),
	},
	(table) => [index("idx_cohorts_tutor_id").on(table.tutorId)],
);

export type Cohort = typeof cohorts.$inferSelect;
export type NewCohort = typeof cohorts.$inferInsert;
