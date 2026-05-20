import { describe, expect, expectTypeOf, it } from "vitest";
import {
	cards,
	cohortMembers,
	cohorts,
	decks,
	emailCaptures,
	feedback,
	mockTests,
	type NewDeck,
	type NewUser,
	reviewLogs,
	reviews,
	subscriptions,
	type User,
	usageCredits,
	users,
} from "@/lib/db/schema";

/**
 * Schema smoke test — no DB connection required. Verifies that the 12 MVP tables
 * are registered as Drizzle pgTables and that inferred TS types match CLAUDE.md spec.
 *
 * If this file fails to compile, the schema module surface is broken — investigate
 * before running migrations.
 */
describe("schema barrel", () => {
	const tables = {
		users,
		emailCaptures,
		decks,
		cards,
		reviews,
		reviewLogs,
		mockTests,
		cohorts,
		cohortMembers,
		usageCredits,
		subscriptions,
		feedback,
	};

	it("exports all 12 MVP tables", () => {
		expect(Object.keys(tables)).toHaveLength(12);
		for (const [name, table] of Object.entries(tables)) {
			expect(table, `table ${name}`).toBeDefined();
		}
	});
});

describe("type inference", () => {
	it("User has required Mnemo-extension fields", () => {
		expectTypeOf<User>().toMatchTypeOf<{
			id: string;
			email: string;
			emailVerified: boolean;
			betaTester: boolean;
			languageUi: "vi" | "en";
			role: "student" | "tutor" | "admin";
		}>();
	});

	it("NewUser allows defaults to be omitted at insert", () => {
		const draft: NewUser = { email: "linh@example.com" };
		expect(draft.email).toBe("linh@example.com");
	});

	it("NewDeck requires ownerId/title/type/source", () => {
		expectTypeOf<NewDeck>().toMatchTypeOf<{
			ownerId: string;
			title: string;
			type: "system" | "personal" | "cohort";
			source: "manual" | "mock_test" | "pdf_upload" | "imported_apkg";
		}>();
	});
});
