import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for stats queries. We mock the db client to return aggregated rows and
 * assert the measured-retention math ((good+easy)/total) + empty handling.
 */

function makeDbMock(rows: unknown[]) {
	function builder() {
		const chain: Record<string, unknown> = {};
		for (const m of ["from", "innerJoin", "where", "groupBy", "orderBy"]) chain[m] = () => chain;
		// biome-ignore lint/suspicious/noThenProperty: test mock must be awaitable like a drizzle builder
		(chain as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(rows);
		return chain;
	}
	return { db: { select: () => builder() } };
}

afterEach(() => {
	vi.resetModules();
	vi.doUnmock("@/lib/db/client");
});

describe("getReviewSummary", () => {
	beforeEach(() => vi.resetModules());

	it("computes overall retention as (good+easy)/total", async () => {
		vi.doMock("@/lib/db/client", () => ({ db: makeDbMock([{ total: 10, recalled: 7 }]).db }));
		const { getReviewSummary } = await import("@/lib/db/queries/stats");
		const s = await getReviewSummary("u1");
		expect(s.totalReviews).toBe(10);
		expect(s.overallRetention).toBeCloseTo(0.7);
	});

	it("returns 0 retention with no reviews", async () => {
		vi.doMock("@/lib/db/client", () => ({ db: makeDbMock([{ total: 0, recalled: 0 }]).db }));
		const { getReviewSummary } = await import("@/lib/db/queries/stats");
		const s = await getReviewSummary("u1");
		expect(s).toEqual({ totalReviews: 0, overallRetention: 0 });
	});
});

describe("getWeeklyRetention", () => {
	beforeEach(() => vi.resetModules());

	it("maps weekly rows to retention ratios", async () => {
		vi.doMock("@/lib/db/client", () => ({
			db: makeDbMock([
				{ week: "2026-05-18", total: 8, recalled: 6 },
				{ week: "2026-05-25", total: 4, recalled: 4 },
			]).db,
		}));
		const { getWeeklyRetention } = await import("@/lib/db/queries/stats");
		const w = await getWeeklyRetention("u1");
		expect(w).toHaveLength(2);
		expect(w[0]?.retention).toBeCloseTo(0.75);
		expect(w[1]?.retention).toBe(1);
	});
});
