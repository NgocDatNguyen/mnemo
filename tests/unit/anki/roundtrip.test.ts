import { describe, expect, it } from "vitest";
import { buildApkg, type ExportCard } from "@/lib/anki/export";
import { parseApkg, UnsupportedApkgError } from "@/lib/anki/import";

/**
 * Round-trip: cards → .apkg → cards. Validates internal consistency of the export
 * (schema, field separator, model-type→cloze detection) and the import parser.
 *
 * NOTE: this does NOT prove the .apkg opens in real Anki desktop — that is a
 * manual verification gate (CLAUDE.md). It proves our writer and reader agree.
 */
describe("Anki .apkg round-trip", () => {
	const cards: ExportCard[] = [
		{ type: "basic", front: "synonym of increase", back: "rise" },
		{ type: "basic", front: "opposite of scarce", back: "abundant" },
		{ type: "cloze", front: "Prices {{c1::rose}} sharply.", back: "trend verb" },
	];

	it("exports a non-empty zip and re-imports equivalent cards", async () => {
		const apkg = await buildApkg("Weakness deck", cards);
		expect(apkg.byteLength).toBeGreaterThan(0);

		const result = await parseApkg(apkg);
		expect(result.title).toBe("Weakness deck");
		expect(result.cards).toHaveLength(3);
	});

	it("preserves field content and card types through the round-trip", async () => {
		const apkg = await buildApkg("Deck", cards);
		const { cards: out } = await parseApkg(apkg);

		// Order isn't guaranteed by SQL, so match by front.
		const basic = out.find((c) => c.front === "synonym of increase");
		expect(basic).toEqual({ type: "basic", front: "synonym of increase", back: "rise" });

		const cloze = out.find((c) => c.front.includes("{{c1::rose}}"));
		expect(cloze?.type).toBe("cloze");
		expect(cloze?.back).toBe("trend verb");
	});

	it("a multi-cloze note re-imports without losing content", async () => {
		// {{c1}} + {{c2}} in one note → Anki makes 2 cards; our import dedups to the
		// single note's front, so the round-trip preserves the text (no data loss).
		const apkg = await buildApkg("Multi", [
			{ type: "cloze", front: "{{c1::Paris}} is the capital of {{c2::France}}.", back: "geo" },
		]);
		const { cards: out } = await parseApkg(apkg);
		expect(out).toHaveLength(1);
		expect(out[0]?.front).toContain("{{c1::Paris}}");
		expect(out[0]?.front).toContain("{{c2::France}}");
	});

	it("detects cloze by {{cN::}} even without model context", async () => {
		const apkg = await buildApkg("D", [
			{ type: "cloze", front: "The {{c1::mitochondria}} is the powerhouse.", back: "" },
		]);
		const { cards: out } = await parseApkg(apkg);
		expect(out[0]?.type).toBe("cloze");
	});

	it("rejects an unsupported (non-collection) zip", async () => {
		const { zipSync } = await import("fflate");
		const junk = zipSync({ "collection.anki21b": new TextEncoder().encode("zstd") });
		await expect(parseApkg(junk)).rejects.toBeInstanceOf(UnsupportedApkgError);
	});
});
