import { boolean, date, index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { languageUiEnum, userRoleEnum } from "./enums";

export const users = pgTable(
	"users",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		email: text().notNull().unique(),
		name: text(),
		emailVerified: boolean().notNull().default(false),
		image: text(),
		role: userRoleEnum().notNull().default("student"),
		currentBand: numeric({ precision: 2, scale: 1, mode: "number" }),
		targetBand: numeric({ precision: 2, scale: 1, mode: "number" }),
		examDate: date({ mode: "date" }),
		languageUi: languageUiEnum().notNull().default("vi"),
		onboardingCompletedAt: timestamp({ withTimezone: true, mode: "date" }),
		betaTester: boolean().notNull().default(false),
		betaJoinedAt: timestamp({ withTimezone: true, mode: "date" }),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_users_beta_tester").on(table.betaTester)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
