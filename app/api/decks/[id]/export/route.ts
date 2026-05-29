import { headers } from "next/headers";
import { buildApkg, type ExportCard } from "@/lib/anki/export";
import { auth } from "@/lib/auth/server";
import { getDeckWithCards } from "@/lib/db/queries";

// sql.js (WASM) needs the Node runtime.
export const runtime = "nodejs";

/**
 * Export a deck as a legacy .apkg download. Owner-scoped. Always free — never
 * gated by canAccessFeature (Anki bridge is free forever per CLAUDE.md).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return new Response("Unauthorized", { status: 401 });

	const { id } = await params;
	const result = await getDeckWithCards(id, session.user.id);
	if (!result) return new Response("Not found", { status: 404 });

	const cards: ExportCard[] = result.cards.map((c) => ({
		type: c.type,
		front: c.front,
		back: c.back,
	}));

	const apkg = await buildApkg(result.deck.title, cards);
	const safeName = result.deck.title.replace(/[^\w-]+/g, "_").slice(0, 50) || "mnemo-deck";

	return new Response(apkg as BodyInit, {
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${safeName}.apkg"`,
		},
	});
}
