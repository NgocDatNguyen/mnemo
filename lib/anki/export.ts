import { createHash, randomBytes } from "node:crypto";
import { zipSync } from "fflate";
import {
	BASIC_MID,
	buildDecksJson,
	buildModelsJson,
	CLOZE_MID,
	DECK_ID,
	DEFAULT_CONF,
	DEFAULT_DCONF,
} from "./models";
import { getSql } from "./sqljs";

const FIELD_SEP = String.fromCharCode(0x1f);

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer, mod integer, scm integer, ver integer, dty integer, usn integer, ls integer, conf text, models text, decks text, dconf text, tags text);
CREATE TABLE notes (id integer primary key, guid text, mid integer, mod integer, usn integer, tags text, flds text, sfld text, csum integer, flags integer, data text);
CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer, mod integer, usn integer, type integer, queue integer, due integer, ivl integer, factor integer, reps integer, lapses integer, left integer, odue integer, odid integer, flags integer, data text);
CREATE TABLE revlog (id integer primary key, cid integer, usn integer, ease integer, ivl integer, lastIvl integer, factor integer, time integer, type integer);
CREATE TABLE graves (usn integer, oid integer, type integer);
CREATE INDEX ix_notes_csum on notes (csum);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
`;

export type ExportCard = { type: "basic" | "cloze"; front: string; back: string };

function stripHtml(s: string): string {
	return s.replace(/<[^>]*>/g, "");
}

/** Distinct cloze ords from a Text field: {{c1::}}→0, {{c2::}}→1, … Falls back to [0]. */
function clozeOrdinals(text: string): number[] {
	const ns = new Set<number>();
	for (const m of text.matchAll(/\{\{c(\d+)::/g)) {
		const n = Number(m[1]);
		if (n >= 1) ns.add(n - 1);
	}
	return ns.size > 0 ? [...ns].sort((a, b) => a - b) : [0];
}

function csumOf(firstField: string): number {
	const hex = createHash("sha1").update(stripHtml(firstField), "utf8").digest("hex").slice(0, 8);
	return Number.parseInt(hex, 16);
}

function guid(): string {
	return randomBytes(8).toString("base64url").slice(0, 10);
}

/**
 * Build a legacy `.apkg` (collection.anki2, schema ver 11) from a deck of cards.
 * Returns the zip bytes. Targets the universal legacy format so it opens in any
 * Anki desktop version. Media is dropped (v1) — the media manifest is `{}`.
 *
 * NOTE: real-Anki-desktop compatibility is validated manually (cannot run Anki
 * here). The round-trip unit test validates internal consistency.
 */
export async function buildApkg(deckName: string, cards: ExportCard[]): Promise<Uint8Array> {
	const SQL = await getSql();
	const db = new SQL.Database();
	try {
		db.run(SCHEMA);

		const now = Date.now();
		const crt = Math.floor(now / 1000);
		db.run(
			"INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')",
			[crt, now, now, DEFAULT_CONF, buildModelsJson(), buildDecksJson(deckName), DEFAULT_DCONF],
		);

		// Monotonic id sequence — note + card ids drawn from one counter so they never
		// collide regardless of how many cards a multi-cloze note expands to.
		let idSeq = now;
		const nextId = () => idSeq++;
		let due = 0;

		for (const card of cards) {
			const noteId = nextId();
			const mid = card.type === "cloze" ? CLOZE_MID : BASIC_MID;
			const flds = `${card.front}${FIELD_SEP}${card.back}`; // FIELD_SEP = 0x1F
			const sfld = stripHtml(card.front);

			db.run(
				"INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) VALUES (?, ?, ?, ?, 0, '', ?, ?, ?, 0, '')",
				[noteId, guid(), mid, crt, flds, sfld, csumOf(card.front)],
			);

			// Anki generates one card per distinct cloze ordinal ({{c1::}}→ord 0, ...).
			// Basic notes have a single card at ord 0.
			const ords = card.type === "cloze" ? clozeOrdinals(card.front) : [0];
			for (const ord of ords) {
				db.run(
					"INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')",
					[nextId(), noteId, DECK_ID, ord, crt, due++],
				);
			}
		}

		const collection = db.export();
		const zip = zipSync({
			"collection.anki2": collection,
			media: new TextEncoder().encode("{}"),
		});
		return zip;
	} finally {
		db.close();
	}
}
