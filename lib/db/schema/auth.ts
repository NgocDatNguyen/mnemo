/**
 * Better Auth-managed tables (session, account, verification).
 *
 * Originally scaffolded by `@better-auth/cli generate` and then harmonized
 * with Mnemo conventions (uuidv7 IDs, snake_case via casing strategy, timestamptz).
 * The CLI also emitted a `user` table — we discard it and alias our existing
 * `users` table from Session 2 via the Better Auth adapter config.
 *
 * `account.password` is a dead column (always NULL): Better Auth's account
 * schema is fixed across configs, and we explicitly disabled email+password.
 */

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./users";

export const sessions = pgTable(
	"session",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text().notNull().unique(),
		expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
		ipAddress: text(),
		userAgent: text(),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_session_user_id").on(table.userId)],
);

export const accounts = pgTable(
	"account",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: text().notNull(),
		providerId: text().notNull(),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		accessTokenExpiresAt: timestamp({ withTimezone: true, mode: "date" }),
		refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: "date" }),
		scope: text(),
		password: text(),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_account_user_id").on(table.userId)],
);

export const verifications = pgTable(
	"verification",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_verification_identifier").on(table.identifier)],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
