/**
 * Better Auth server config.
 *
 * Magic link only via Resend. No passwords, no OAuth. Per CLAUDE.md
 * decisions log (2026-05-20).
 *
 * Beta cap enforcement: see `databaseHooks.user.create.before` below. Soft cap
 * (1-2 over BETA_USER_LIMIT possible under concurrent signups — acceptable
 * per Session 3 plan; tighten to SERIALIZABLE transaction if needed later).
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verifications } from "@/lib/db/schema";
import { sendMagicLinkEmail } from "@/lib/email/magic-link";
import { BETA_MODE, BETA_USER_LIMIT } from "./access";

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,

	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: users, // alias our Session 2 users table to Better Auth's "user"
			session: sessions,
			account: accounts,
			verification: verifications,
		},
	}),

	emailAndPassword: { enabled: false },

	user: {
		// Register Mnemo-specific user columns so Better Auth's adapter factory
		// includes them when INSERTing. Without this declaration, transformInput
		// in @better-auth/core silently drops these fields from the create path
		// and the DB defaults (beta_tester=false, beta_joined_at=null) win,
		// regardless of what databaseHooks.user.create.before returns.
		additionalFields: {
			betaTester: { type: "boolean", required: false, defaultValue: false },
			betaJoinedAt: { type: "date", required: false },
		},
	},

	advanced: {
		database: {
			generateId: () => uuidv7(),
		},
	},

	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 60 * 24, // refresh daily
	},

	plugins: [
		magicLink({
			expiresIn: 60 * 5, // 5 minutes
			disableSignUp: false, // allow new-user signup; cap enforced in hook
			sendMagicLink: async ({ email, url }) => {
				await sendMagicLinkEmail({ to: email, url });
			},
		}),
	],

	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					// Cap only applies during beta. Existing users signing in don't
					// hit this hook (Better Auth only calls `create.before` on new
					// user creation, not on session creation for existing users).
					if (BETA_MODE) {
						const result = await db
							.select({ value: count() })
							.from(users)
							.where(eq(users.betaTester, true));
						const existing = result[0]?.value ?? 0;

						if (existing >= BETA_USER_LIMIT) {
							throw new APIError("FORBIDDEN", {
								code: "BETA_CAP_REACHED",
								message: "Beta is currently at capacity.",
							});
						}
					}

					return {
						data: {
							...user,
							betaTester: BETA_MODE,
							betaJoinedAt: BETA_MODE ? new Date() : null,
						},
					};
				},
			},
		},
	},
});

export type Auth = typeof auth;
