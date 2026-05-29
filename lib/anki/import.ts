import { unzipSync } from "fflate";
import { getSql } from "./sqljs";

const FIELD_SEP = String.fromCodePoint(0x1f);
const CLOZE_RE = /\{\{c\d+::/;

// Bounds against zip bombs / oversized decks. No-media .apkg is tiny; these are generous.
const COLLECTION_NAMES = new Set(["collection.anki21", "collection.anki2", "collection.anki21b"]);
const MAX_COLLECTION_BYTES = 50 * 1024 * 1024; // declared uncompressed size of the SQLite file
const MAX_CARDS = 5000;

export type ImportedCard = { type: "basic" | "cloze"; front: string; back: string };
export type ImportResult = { title: string; cards: ImportedCard[] };

export class UnsupportedApkgError extends Error {}
export class ApkgTooLargeError extends Error {}

/**
 * Parse a legacy `.apkg` into cards. Reads collection.anki21 or collection.anki2.
 * The modern zstd-compressed collection.anki21b is NOT supported (v1) — throws
 * UnsupportedApkgError so the caller can show a clear message.
 *
 * Field mapping: note field[0] → front, field[1] → back. A note is "cloze" if its
 * model type is 1 OR the front contains a {{cN::...}} deletion.
 *
 * Zip-bomb defense: only the collection entry is inflated (media skipped), and any
 * entry whose declared uncompressed size exceeds MAX_COLLECTION_BYTES is rejected
 * before inflation via fflate's filter.
 */
export async function parseApkg(bytes: Uint8Array): Promise<ImportResult> {
	const files = unzipSync(bytes, {
		filter: (file) => {
			if (!COLLECTION_NAMES.has(file.name)) return false; // skip media etc.
			if (file.originalSize > MAX_COLLECTION_BYTES) {
				throw new ApkgTooLargeError("Anki collection is too large to import.");
			}
			return true;
		},
	});

	if (files["collection.anki21b"] && !files["collection.anki21"] && !files["collection.anki2"]) {
		throw new UnsupportedApkgError(
			"This .apkg uses the modern compressed format (anki21b). Export it from Anki as a legacy/older-Anki package.",
		);
	}

	const collection = files["collection.anki21"] ?? files["collection.anki2"];
	if (!collection) {
		throw new UnsupportedApkgError("No Anki collection found in this .apkg.");
	}

	const SQL = await getSql();
	const db = new SQL.Database(collection);
	try {
		const colRes = db.exec("SELECT models, decks FROM col LIMIT 1");
		const modelsJson = (colRes[0]?.values[0]?.[0] as string) ?? "{}";
		const decksJson = (colRes[0]?.values[0]?.[1] as string) ?? "{}";

		const clozeMids = new Set<string>();
		for (const [mid, model] of Object.entries(
			JSON.parse(modelsJson) as Record<string, { type?: number }>,
		)) {
			if (model?.type === 1) clozeMids.add(String(mid));
		}

		const title = pickDeckTitle(decksJson);

		// Cap ingestion (LIMIT MAX_CARDS+1 to detect overflow without materializing huge decks).
		const notesRes = db.exec(`SELECT mid, flds FROM notes LIMIT ${MAX_CARDS + 1}`);
		const rows = notesRes[0]?.values ?? [];
		if (rows.length > MAX_CARDS) {
			throw new ApkgTooLargeError(`Deck exceeds the ${MAX_CARDS}-card import limit.`);
		}
		const cards: ImportedCard[] = [];
		for (const row of rows) {
			const mid = String(row[0]);
			const flds = String(row[1] ?? "");
			const fields = flds.split(FIELD_SEP);
			const front = (fields[0] ?? "").trim();
			const back = (fields[1] ?? "").trim();
			if (!front) continue;
			const isCloze = clozeMids.has(mid) || CLOZE_RE.test(front);
			cards.push({ type: isCloze ? "cloze" : "basic", front, back });
		}

		return { title, cards };
	} finally {
		db.close();
	}
}

/** First non-Default deck name, else "Imported deck". */
function pickDeckTitle(decksJson: string): string {
	try {
		const decks = JSON.parse(decksJson) as Record<string, { name?: string }>;
		for (const deck of Object.values(decks)) {
			if (deck?.name && deck.name !== "Default") return deck.name;
		}
	} catch {
		// fall through
	}
	return "Imported deck";
}
