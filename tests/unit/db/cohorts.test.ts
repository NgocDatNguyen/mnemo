import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for joinCohort branching (tutor-can't-join, not-found, success upsert).
 * The db client is mocked; we assert the JoinResult, not SQL.
 */

function makeDbMock(opts: { cohortRow?: unknown }) {
	const selectRows = opts.cohortRow ? [opts.cohortRow] : [];
	let upserted = false;
	const db = {
		select: () => {
			const chain: Record<string, unknown> = {};
			for (const m of ["from", "where", "limit"]) chain[m] = () => chain;
			// biome-ignore lint/suspicious/noThenProperty: awaitable drizzle-builder mock
			(chain as { then: unknown }).then = (r: (v: unknown) => void) => r(selectRows);
			return chain;
		},
		insert: () => ({
			values: () => ({
				onConflictDoUpdate: async () => {
					upserted = true;
				},
			}),
		}),
	};
	return { db, didUpsert: () => upserted };
}

afterEach(() => {
	vi.resetModules();
	vi.doUnmock("@/lib/db/client");
});

describe("joinCohort", () => {
	beforeEach(() => vi.resetModules());

	it("returns not_found for an unknown/closed token", async () => {
		const { db } = makeDbMock({ cohortRow: undefined });
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { joinCohort } = await import("@/lib/db/queries/cohorts");
		expect(await joinCohort("bad", "user-1")).toEqual({ ok: false, reason: "not_found" });
	});

	it("rejects the tutor joining their own cohort", async () => {
		const { db, didUpsert } = makeDbMock({
			cohortRow: { id: "c1", name: "Class A", tutorId: "tutor-1" },
		});
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { joinCohort } = await import("@/lib/db/queries/cohorts");
		expect(await joinCohort("tok", "tutor-1")).toEqual({ ok: false, reason: "is_tutor" });
		expect(didUpsert()).toBe(false);
	});

	it("joins a student and upserts membership", async () => {
		const { db, didUpsert } = makeDbMock({
			cohortRow: { id: "c1", name: "Class A", tutorId: "tutor-1" },
		});
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { joinCohort } = await import("@/lib/db/queries/cohorts");
		expect(await joinCohort("tok", "student-1")).toEqual({ ok: true, cohortName: "Class A" });
		expect(didUpsert()).toBe(true);
	});
});
