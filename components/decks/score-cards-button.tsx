"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { scoreDeckNow } from "@/app/(app)/decks/[id]/actions";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";

/**
 * Recovery affordance shown when a deck has unscored cards (background scoring at
 * generation time never completed). Re-runs the Quality Engine on demand.
 */
export function ScoreCardsButton({ deckId }: { deckId: string }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [errored, setErrored] = useState(false);
	const t = copy.decks.scoring;

	function handleClick() {
		setErrored(false);
		startTransition(async () => {
			const res = await scoreDeckNow(deckId);
			if (res.ok) {
				router.refresh();
			} else {
				setErrored(true);
			}
		});
	}

	return (
		<div className="mb-6 rounded-lg border border-border bg-bg-subtle px-4 py-3">
			<p className="text-sm text-text-secondary">{t.pending}</p>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="mt-2"
				disabled={pending}
				onClick={handleClick}
			>
				{pending ? t.scoring : t.cta}
			</Button>
			{errored && <p className="mt-2 text-sm text-error">{t.error}</p>}
		</div>
	);
}
