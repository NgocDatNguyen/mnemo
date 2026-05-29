import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { listDecksByOwner } from "@/lib/db/queries";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const decks = await listDecksByOwner(session.user.id);
	const t = copy.decks;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
			<header className="mb-8">
				<h1 className="font-display text-2xl font-medium text-text">{t.pageTitle}</h1>
				<p className="mt-2 text-text-secondary">{t.pageSubhead}</p>
			</header>

			{decks.length === 0 ? (
				<div className="rounded-lg border border-border bg-bg-subtle p-8 text-center">
					<h2 className="font-medium text-text">{t.empty.title}</h2>
					<p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{t.empty.body}</p>
					<Button asChild className="mt-5 bg-accent text-text-inverse hover:bg-accent-hover">
						<Link href="/mock-tests/upload">{t.empty.cta}</Link>
					</Button>
				</div>
			) : (
				<ul className="space-y-3">
					{decks.map((deck) => (
						<li key={deck.id}>
							<Link
								href={`/decks/${deck.id}`}
								className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3 hover:border-border-strong"
							>
								<div>
									<p className="font-medium text-text">{deck.title}</p>
									<p className="text-sm text-text-muted">
										{deck.cardCount} {t.cardCountLabel} · {t.sourceLabels[deck.source]}
									</p>
								</div>
								<span aria-hidden="true" className="text-text-muted">
									→
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
