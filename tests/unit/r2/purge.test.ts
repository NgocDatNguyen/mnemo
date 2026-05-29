import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests purgeExpiredUploads: it deletes the R2 object and nulls raw_input_url for
 * each expired row, and tolerates R2 delete failures (still nulls, counts failed).
 */

const deleted: string[] = [];

function makeDbMock(rows: { id: string; rawInputUrl: string | null }[]) {
	const updates: string[] = [];
	const db = {
		select: () => {
			const chain: Record<string, unknown> = {};
			chain.from = () => chain;
			// biome-ignore lint/suspicious/noThenProperty: awaitable drizzle-builder mock
			chain.where = (..._a: unknown[]) => ({ then: (r: (v: unknown) => void) => r(rows) });
			return chain;
		},
		update: () => ({ set: () => ({ where: async (cond: unknown) => updates.push(String(cond)) }) }),
	};
	return { db, updates };
}

beforeEach(() => {
	vi.resetModules();
	deleted.length = 0;
});
afterEach(() => {
	vi.doUnmock("@/lib/db/client");
	vi.doUnmock("@/lib/r2/objects");
});

describe("purgeExpiredUploads", () => {
	it("deletes objects and nulls raw_input_url for each expired row", async () => {
		const { db, updates } = makeDbMock([
			{ id: "a", rawInputUrl: "users/u/a.jpg" },
			{ id: "b", rawInputUrl: "users/u/b.pdf" },
		]);
		vi.doMock("@/lib/db/client", () => ({ db }));
		vi.doMock("@/lib/r2/objects", () => ({
			deleteObject: async (k: string) => {
				deleted.push(k);
			},
		}));
		const { purgeExpiredUploads } = await import("@/lib/r2/purge");

		const res = await purgeExpiredUploads(new Date("2026-06-30T00:00:00Z"));
		expect(res).toEqual({ purged: 2, failed: 0 });
		expect(deleted).toEqual(["users/u/a.jpg", "users/u/b.pdf"]);
		expect(updates).toHaveLength(2);
	});

	it("counts a failed R2 delete but still nulls the column", async () => {
		const { db, updates } = makeDbMock([{ id: "a", rawInputUrl: "users/u/a.jpg" }]);
		vi.doMock("@/lib/db/client", () => ({ db }));
		vi.doMock("@/lib/r2/objects", () => ({
			deleteObject: async () => {
				throw new Error("R2 down");
			},
		}));
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { purgeExpiredUploads } = await import("@/lib/r2/purge");

		const res = await purgeExpiredUploads();
		expect(res).toEqual({ purged: 1, failed: 1 });
		expect(updates).toHaveLength(1); // column still nulled
		errSpy.mockRestore();
	});
});
