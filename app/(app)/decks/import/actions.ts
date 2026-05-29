"use server";

import { headers } from "next/headers";
import { ApkgTooLargeError, parseApkg, UnsupportedApkgError } from "@/lib/anki/import";
import { auth } from "@/lib/auth/server";
import { createDeckWithCards } from "@/lib/db/queries";

// Compressed upload cap (defense alongside the import.ts decompressed-size guard).
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export type ImportResult =
	| { ok: true; deckId: string; cardCount: number }
	| {
			ok: false;
			error: "UNAUTHORIZED" | "NO_FILE" | "UNSUPPORTED" | "EMPTY" | "TOO_LARGE" | "INTERNAL";
	  };

/**
 * Import an uploaded .apkg into a new deck (source=imported_apkg) and seed FSRS
 * reviews so the cards are immediately reviewable. Always free (not gated).
 *
 * Each import creates a NEW deck (no cross-import dedup) — matches a "new deck per
 * import" mental model; revisit if duplicate decks become a complaint.
 *
 * Body-size note: Next server actions default to 1MB; bumped to 10mb in next.config.
 * We additionally reject files over MAX_FILE_BYTES here and bound decompression in
 * parseApkg (zip-bomb guard).
 */
export async function importApkg(formData: FormData): Promise<ImportResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { ok: false, error: "UNAUTHORIZED" };

	const file = formData.get("file");
	if (!(file instanceof File) || file.size === 0) return { ok: false, error: "NO_FILE" };
	if (file.size > MAX_FILE_BYTES) return { ok: false, error: "TOO_LARGE" };

	try {
		const bytes = new Uint8Array(await file.arrayBuffer());
		const { title, cards } = await parseApkg(bytes);
		if (cards.length === 0) return { ok: false, error: "EMPTY" };

		const deckId = await createDeckWithCards({
			ownerId: session.user.id,
			title,
			type: "personal",
			source: "imported_apkg",
			seedReviewsForUserId: session.user.id,
			cards: cards.map((c) => ({ type: c.type, front: c.front, back: c.back })),
		});

		return { ok: true, deckId, cardCount: cards.length };
	} catch (err) {
		if (err instanceof UnsupportedApkgError) return { ok: false, error: "UNSUPPORTED" };
		if (err instanceof ApkgTooLargeError) return { ok: false, error: "TOO_LARGE" };
		console.error("[importApkg] failed", err);
		return { ok: false, error: "INTERNAL" };
	}
}
