import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for recordReview — the atomic (update reviews + insert review_logs) batch.
 * Mocks the db client; asserts batch composition + NOT_FOUND handling.
 */

type Captured = { batches: unknown[][] };

function makeDbMock(opts: { reviewRow?: unknown } = {}) {
	const captured: Captured = { batches: [] };
	const selectRows = opts.reviewRow ? [opts.reviewRow] : [];

	function selectBuilder() {
		const chain: Record<string, unknown> = {};
		for (const m of ["from", "where", "limit", "innerJoin", "orderBy"]) chain[m] = () => chain;
		// biome-ignore lint/suspicious/noThenProperty: test mock must be awaitable like a drizzle builder
		(chain as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(selectRows);
		return chain;
	}
	const passthrough = () => {
		const b: Record<string, unknown> = {};
		b.set = () => b;
		b.where = () => b;
		b.values = () => b;
		return b;
	};

	const db = {
		select: () => selectBuilder(),
		update: () => passthrough(),
		insert: () => passthrough(),
		batch: async (stmts: unknown[]) => {
			captured.batches.push(stmts);
			return stmts.map(() => []);
		},
	};
	return { db, captured };
}

afterEach(() => {
	vi.resetModules();
	vi.doUnmock("@/lib/db/client");
});

describe("recordReview", () => {
	beforeEach(() => vi.resetModules());

	const reviewRow = {
		id: "review-1",
		userId: "user-1",
		cardId: "card-1",
		stability: 0,
		difficulty: 0,
		retrievability: 0,
		state: "new" as const,
		due: new Date("2026-05-29T00:00:00Z"),
		lastReview: null,
		lapses: 0,
		reps: 0,
	};

	it("returns NOT_FOUND when no review row exists for the user/card", async () => {
		const { db } = makeDbMock({ reviewRow: undefined });
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { recordReview } = await import("@/lib/db/queries/reviews");

		const r = await recordReview("user-1", "missing-card", "good");
		expect(r).toEqual({ ok: false, error: "NOT_FOUND" });
	});

	it("batches an update + log insert on a valid rating", async () => {
		const { db, captured } = makeDbMock({ reviewRow });
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { recordReview } = await import("@/lib/db/queries/reviews");

		const r = await recordReview("user-1", "card-1", "good");
		expect(r).toEqual({ ok: true });
		expect(captured.batches).toHaveLength(1);
		expect(captured.batches[0]).toHaveLength(2); // update reviews + insert review_logs
	});
});
