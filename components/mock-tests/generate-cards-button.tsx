"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateCards } from "@/app/(app)/mock-tests/[id]/generate-cards-action";
import { copy } from "@/lib/i18n/copy";

/**
 * Client CTA that turns weakness analysis into a deck. If the deck already exists
 * (generatedDeckId set), the server action short-circuits and we navigate straight
 * to it. Otherwise: loading → generate → navigate to /decks/[id], or surface an error.
 */
export function GenerateCardsButton({
	testId,
	existingDeckId,
}: {
	testId: string;
	existingDeckId: string | null;
}) {
	const router = useRouter();
	const [state, setState] = useState<"idle" | "loading" | "error">("idle");
	const t = copy.mockTests.detail.analysis.cardGen;

	// Already generated → straight link to the deck.
	if (existingDeckId) {
		return (
			<button
				type="button"
				onClick={() => router.push(`/decks/${existingDeckId}`)}
				className="mt-8 w-full rounded-md bg-accent px-4 py-3 text-sm font-medium text-text-inverse hover:bg-accent-hover"
			>
				{t.viewDeck}
			</button>
		);
	}

	async function handleClick() {
		setState("loading");
		const result = await generateCards(testId);
		if (result.ok) {
			router.push(`/decks/${result.deckId}`);
			return;
		}
		setState("error");
	}

	return (
		<div className="mt-8">
			<button
				type="button"
				onClick={handleClick}
				disabled={state === "loading"}
				className="w-full rounded-md bg-accent px-4 py-3 text-sm font-medium text-text-inverse hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
			>
				{state === "loading" ? t.generating : t.cta}
			</button>
			{state === "error" && <p className="mt-2 text-sm text-error">{t.error}</p>}
		</div>
	);
}
