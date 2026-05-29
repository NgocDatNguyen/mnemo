"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { rateCard } from "@/app/(app)/review/actions";
import { Button } from "@/components/ui/button";
import type { DueCard } from "@/lib/db/queries";
import type { ReviewRating } from "@/lib/fsrs";
import { copy } from "@/lib/i18n/copy";

const RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];
const CLOZE_RE = /\{\{c\d+::(.*?)\}\}/g;

/** Front text with cloze deletions blanked; basic cards pass through unchanged. */
function frontText(card: DueCard, blank: string): string {
	return card.type === "cloze" ? card.front.replace(CLOZE_RE, blank) : card.front;
}
/** Revealed answer: cloze → the sentence with deletions filled in; basic → the back. */
function answerText(card: DueCard): string {
	return card.type === "cloze" ? card.front.replace(CLOZE_RE, "$1") : card.back;
}

/**
 * One review session over a pre-fetched due queue. Front → reveal back → rate.
 * The flashcard is the only place shadows are allowed (design tokens). No streaks,
 * no progress gamification — just a quiet counter.
 *
 * Rating is only committed-then-advanced when the server action succeeds; on
 * failure the card stays in place with an inline retry so a rating is never
 * silently lost (the FSRS schedule + review_log must actually persist).
 */
export function ReviewSession({ initialCards }: { initialCards: DueCard[] }) {
	const t = copy.review;
	const [queue] = useState(initialCards);
	const [index, setIndex] = useState(0);
	const [revealed, setRevealed] = useState(false);
	const [errored, setErrored] = useState(false);
	const [pending, startTransition] = useTransition();

	const current = queue[index];

	if (!current) {
		return (
			<div className="rounded-lg border border-border bg-bg-subtle p-8 text-center">
				<h2 className="font-medium text-text">{t.empty.title}</h2>
				<p className="mt-2 text-sm text-text-secondary">{t.empty.body}</p>
				<Link href="/decks" className="mt-4 inline-block text-sm text-accent hover:underline">
					{t.empty.toDecks}
				</Link>
			</div>
		);
	}

	function handleRate(rating: ReviewRating) {
		const card = queue[index];
		if (!card) return;
		setErrored(false);
		startTransition(async () => {
			try {
				const res = await rateCard(card.cardId, rating);
				if (!res.ok) {
					setErrored(true); // keep the card in place for retry
					return;
				}
				setRevealed(false);
				setIndex((i) => i + 1);
			} catch {
				setErrored(true);
			}
		});
	}

	return (
		<div>
			<p className="mb-4 text-center font-mono text-sm text-text-muted">
				{index + 1} / {queue.length}
			</p>

			<div className="rounded-xl border border-border bg-bg-elevated p-8 shadow-sm">
				<p className="text-center font-display text-2xl leading-9 text-text">
					{frontText(current, t.clozeBlank)}
				</p>
				{revealed && (
					<>
						<hr className="my-6 border-border" />
						<p className="text-center text-lg text-text-secondary">{answerText(current)}</p>
						{current.context && (
							<p className="mt-3 text-center text-sm italic text-text-muted">{current.context}</p>
						)}
					</>
				)}
			</div>

			{errored && <p className="mt-4 text-center text-sm text-error">{t.rateError}</p>}

			{revealed ? (
				<div className="mt-6 grid grid-cols-4 gap-2">
					{RATINGS.map((r) => (
						<Button
							key={r}
							type="button"
							variant="outline"
							disabled={pending}
							onClick={() => handleRate(r)}
						>
							{t.ratings[r]}
						</Button>
					))}
				</div>
			) : (
				<Button
					type="button"
					onClick={() => setRevealed(true)}
					className="mt-6 w-full bg-accent text-text-inverse hover:bg-accent-hover"
				>
					{t.showAnswer}
				</Button>
			)}
		</div>
	);
}
