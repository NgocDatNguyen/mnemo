import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CardItem } from "@/components/decks/card-item";
import { ScoreCardsButton } from "@/components/decks/score-cards-button";
import { auth } from "@/lib/auth/server";
import { getDeckWithCards } from "@/lib/db/queries";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

export default async function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const { id } = await params;
	const result = await getDeckWithCards(id, session.user.id);
	if (!result) notFound(); // not found OR not owned — no existence leak

	const { deck, cards } = result;
	const t = copy.decks;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
			<Link href="/decks" className="text-sm text-accent hover:underline">
				{t.detail.backToList}
			</Link>

			<header className="mt-4 mb-8">
				<h1 className="font-display text-2xl font-medium text-text">{deck.title}</h1>
				{deck.description && <p className="mt-2 text-text-secondary">{deck.description}</p>}
				<p className="mt-1 text-sm text-text-muted">
					{deck.cardCount} {t.cardCountLabel} · {t.sourceLabels[deck.source]}
				</p>
			</header>

			{cards.some((c) => c.qualityScore === null) && <ScoreCardsButton deckId={deck.id} />}

			{cards.length === 0 ? (
				<p className="text-text-secondary">{t.detail.emptyCards}</p>
			) : (
				<ul className="space-y-3">
					{cards.map((card) => (
						<CardItem key={card.id} card={card} />
					))}
				</ul>
			)}
		</main>
	);
}
