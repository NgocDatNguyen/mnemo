import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for lib/db/queries/{decks,cards}.ts.
 *
 * Strategy: mock `@/lib/db/client` with a recording fake whose chainable methods
 * capture what would be sent. We assert the *shape* of writes (cardCount sync,
 * batch composition, user-scoping in reads) without a real DB — mirrors the
 * vi.doMock pattern in auth/access.test.ts.
 */

type Captured = {
	batches: unknown[][];
	insertValues: unknown[];
	selectWheres: number;
};

function makeDbMock(opts: { selectRows?: unknown[][] } = {}) {
	const captured: Captured = { batches: [], insertValues: [], selectWheres: 0 };
	const selectQueue = [...(opts.selectRows ?? [])];

	// Chainable select builder that resolves to the next queued row-set when awaited.
	function selectBuilder() {
		const rows = selectQueue.shift() ?? [];
		const chain: Record<string, unknown> = {};
		for (const m of ["from", "where", "orderBy", "limit", "innerJoin"]) {
			chain[m] = () => chain;
		}
		// make it thenable so `await db.select()...` resolves to rows
		// biome-ignore lint/suspicious/noThenProperty: test mock must be awaitable like a drizzle query builder
		(chain as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(rows);
		return chain;
	}

	const insertBuilder = () => {
		const b: Record<string, unknown> = {};
		b.values = (v: unknown) => {
			captured.insertValues.push(v);
			b._kind = "insert";
			b.returning = () => b;
			return b;
		};
		return b;
	};
	const updateBuilder = () => {
		const b: Record<string, unknown> = { _kind: "update" };
		b.set = () => b;
		b.where = () => b;
		return b;
	};
	const deleteBuilder = () => {
		const b: Record<string, unknown> = { _kind: "delete" };
		b.where = () => b;
		return b;
	};

	const db = {
		select: () => selectBuilder(),
		insert: () => insertBuilder(),
		update: () => updateBuilder(),
		delete: () => deleteBuilder(),
		batch: async (stmts: unknown[]) => {
			captured.batches.push(stmts);
			// Emulate returning() on the first insert (insertCard reads row[0])
			return stmts.map(() => [{ id: "generated-card-id" }]);
		},
	};

	return { db, captured };
}

afterEach(() => {
	vi.resetModules();
	vi.doUnmock("@/lib/db/client");
});

describe("createDeckWithCards", () => {
	beforeEach(() => vi.resetModules());

	it("sets cardCount to the number of cards and returns a deck id", async () => {
		const { db, captured } = makeDbMock();
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { createDeckWithCards } = await import("@/lib/db/queries/decks");

		const id = await createDeckWithCards({
			ownerId: "user-1",
			title: "Weakness deck",
			type: "personal",
			source: "mock_test",
			sourceMockTestId: "mt-1",
			cards: [
				{ type: "basic", front: "a", back: "1" },
				{ type: "basic", front: "b", back: "2" },
				{ type: "cloze", front: "c {{c1::x}}", back: "" },
			],
		});

		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);

		// One batch: deck insert + cards insert + mock-test backlink update = 3 statements
		expect(captured.batches).toHaveLength(1);
		expect(captured.batches[0]).toHaveLength(3);

		// First insert .values is the deck row with cardCount = 3
		const deckValues = captured.insertValues[0] as { cardCount: number; id: string };
		expect(deckValues.cardCount).toBe(3);
		expect(deckValues.id).toBe(id);
	});

	it("omits the cards-insert statement when there are no cards", async () => {
		const { db, captured } = makeDbMock();
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { createDeckWithCards } = await import("@/lib/db/queries/decks");

		await createDeckWithCards({
			ownerId: "user-1",
			title: "Empty",
			type: "personal",
			source: "manual",
			cards: [],
		});

		// Only the deck insert (no cards, no sourceMockTestId backlink)
		expect(captured.batches[0]).toHaveLength(1);
	});
});

describe("getDeckWithCards user-scoping", () => {
	beforeEach(() => vi.resetModules());

	it("returns null when the deck is not owned by the user", async () => {
		// First select (deck lookup) returns empty → not owned / not found
		const { db } = makeDbMock({ selectRows: [[]] });
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { getDeckWithCards } = await import("@/lib/db/queries/decks");

		const result = await getDeckWithCards("deck-x", "user-other");
		expect(result).toBeNull();
	});

	it("returns deck + cards when owned", async () => {
		const { db } = makeDbMock({
			selectRows: [
				[{ id: "deck-1", ownerId: "user-1", title: "Mine", cardCount: 1 }], // deck lookup
				[{ id: "card-1", deckId: "deck-1", front: "a", back: "1" }], // cards lookup
			],
		});
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { getDeckWithCards } = await import("@/lib/db/queries/decks");

		const result = await getDeckWithCards("deck-1", "user-1");
		expect(result).not.toBeNull();
		expect(result?.deck.id).toBe("deck-1");
		expect(result?.cards).toHaveLength(1);
	});
});

describe("insertCard / deleteCard cardCount sync", () => {
	beforeEach(() => vi.resetModules());

	it("insertCard batches the card insert with a cardCount increment", async () => {
		const { db, captured } = makeDbMock();
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { insertCard } = await import("@/lib/db/queries/cards");

		const id = await insertCard("deck-1", { type: "basic", front: "x", back: "y" });
		expect(id).toBe("generated-card-id");
		expect(captured.batches).toHaveLength(1);
		expect(captured.batches[0]).toHaveLength(2); // insert + cardCount update
	});

	it("deleteCard returns false when the card does not exist or is not owned", async () => {
		const { db } = makeDbMock({ selectRows: [[]] }); // owner-scoped lookup empty
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { deleteCard } = await import("@/lib/db/queries/cards");

		expect(await deleteCard("missing", "user-1")).toBe(false);
	});

	it("deleteCard batches delete + decrement when the user owns the card", async () => {
		const { db, captured } = makeDbMock({ selectRows: [[{ deckId: "deck-1" }]] });
		vi.doMock("@/lib/db/client", () => ({ db }));
		const { deleteCard } = await import("@/lib/db/queries/cards");

		expect(await deleteCard("card-1", "user-1")).toBe(true);
		expect(captured.batches[0]).toHaveLength(2); // delete + cardCount decrement
	});
});
