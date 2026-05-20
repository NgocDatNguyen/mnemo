import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { cohorts } from "./cohorts";
import { cohortMemberStatusEnum } from "./enums";
import { users } from "./users";

export const cohortMembers = pgTable(
	"cohort_members",
	{
		cohortId: uuid()
			.notNull()
			.references(() => cohorts.id, { onDelete: "cascade" }),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: cohortMemberStatusEnum().notNull().default("invited"),
		joinedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.cohortId, table.userId] }),
		index("idx_cohort_members_user_id").on(table.userId),
	],
);

export type CohortMember = typeof cohortMembers.$inferSelect;
export type NewCohortMember = typeof cohortMembers.$inferInsert;
