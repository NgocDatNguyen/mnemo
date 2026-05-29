import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for lib/db/queries/usage.ts recordUsage — best-effort upsert that must
 * never throw on the hot AI path, and must increment the right counters.
 */

type Captured = { values: unknown[]; conflictSet: unknown[]; threw: boolean };

function makeDbMock(opts: { failInsert?: boolean } = {}) {
	const captured: Captured = { values: [], conflictSet: [], threw: false };
	const db = {
		insert: () => ({
			values: (v: unknown) => {
				captured.values.push(v);
				return {
					onConflictDoUpdate: async (cfg: { set: unknown }) => {
						captured.conflictSet.push(cfg.set);
						if (opts.failInsert) {
							captured.threw = true;
							throw new Error("db down");
						}
					},
				};
			},
		}),
	};
	return { db, captured };
}

afterEach(() => {
	vi.resetModules();
	vi.doUnmock("@/lib/db/client");
});

describe("recordUsage", () => {
	beforeEach(() => vi.resetModules());

	it("inserts the period row with the provided deltas", async () => {
		const { db, captured } = makeDbMock();
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { recordUsage } = await import("@/lib/db/queries/usage");

		await recordUsage("user-1", { mockTestsUsed: 1, aiCostCents: 3 });

		const v = captured.values[0] as {
			userId: string;
			mockTestsUsed: number;
			cardsGenerated: number;
			aiCostEstimateCents: number;
			periodStart: Date;
		};
		expect(v.userId).toBe("user-1");
		expect(v.mockTestsUsed).toBe(1);
		expect(v.cardsGenerated).toBe(0);
		expect(v.aiCostEstimateCents).toBe(3);
		// periodStart is first-of-month UTC midnight
		expect(v.periodStart.getUTCDate()).toBe(1);
		expect(v.periodStart.getUTCHours()).toBe(0);
	});

	it("defaults all counters to 0 when omitted", async () => {
		const { db, captured } = makeDbMock();
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { recordUsage } = await import("@/lib/db/queries/usage");

		await recordUsage("user-1", { cardsGenerated: 12 });
		const v = captured.values[0] as { mockTestsUsed: number; cardsGenerated: number };
		expect(v.mockTestsUsed).toBe(0);
		expect(v.cardsGenerated).toBe(12);
	});

	it("never throws even if the DB write fails (best-effort)", async () => {
		const { db, captured } = makeDbMock({ failInsert: true });
		vi.doMock("@/lib/db/client", () => ({ db }));
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { recordUsage } = await import("@/lib/db/queries/usage");

		await expect(recordUsage("user-1", { mockTestsUsed: 1 })).resolves.toBeUndefined();
		expect(captured.threw).toBe(true);
		errSpy.mockRestore();
	});
});
