"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { editCard } from "@/app/(app)/decks/[id]/card-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Card } from "@/lib/db/schema";
import { copy } from "@/lib/i18n/copy";
import { QualityBadge } from "./quality-badge";

/**
 * A deck card with an inline view/edit toggle. Editing saves via the editCard
 * action (owner-scoped) which re-scores the card, then refreshes the server view.
 */
export function CardItem({ card }: { card: Card }) {
	const router = useRouter();
	const t = copy.decks;
	const [editing, setEditing] = useState(false);
	const [errored, setErrored] = useState(false);
	const [pending, startTransition] = useTransition();

	function onSubmit(formData: FormData) {
		setErrored(false);
		startTransition(async () => {
			const res = await editCard(card.id, {
				type: formData.get("type"),
				front: formData.get("front"),
				back: formData.get("back"),
				context: (formData.get("context") as string) || undefined,
			});
			if (res.ok) {
				setEditing(false);
				router.refresh();
			} else {
				setErrored(true);
			}
		});
	}

	const fieldCls =
		"w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text";

	if (editing) {
		return (
			<li className="rounded-lg border border-border bg-bg-elevated p-4">
				<form action={onSubmit} className="space-y-2">
					<select
						name="type"
						defaultValue={card.type}
						className={fieldCls}
						aria-label={t.editor.type}
					>
						<option value="basic">basic</option>
						<option value="cloze">cloze</option>
					</select>
					<Textarea
						name="front"
						defaultValue={card.front}
						required
						rows={2}
						aria-label={t.detail.frontLabel}
					/>
					<Textarea
						name="back"
						defaultValue={card.back}
						required
						rows={2}
						aria-label={t.detail.backLabel}
					/>
					<Textarea
						name="context"
						defaultValue={card.context ?? ""}
						rows={2}
						aria-label={t.detail.contextLabel}
						placeholder={t.detail.contextLabel}
					/>
					{errored && <p className="text-sm text-error">{t.editor.error}</p>}
					<div className="flex gap-2">
						<Button
							type="submit"
							size="sm"
							disabled={pending}
							className="bg-accent text-text-inverse hover:bg-accent-hover"
						>
							{pending ? t.editor.saving : t.editor.save}
						</Button>
						<Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
							{t.editor.cancel}
						</Button>
					</div>
				</form>
			</li>
		);
	}

	return (
		<li className="rounded-lg border border-border bg-bg-elevated p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="font-medium text-text">{card.front}</p>
				<div className="flex shrink-0 items-center gap-2">
					<QualityBadge score={card.qualityScore} />
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="text-xs text-text-muted underline underline-offset-2 hover:text-text"
					>
						{t.editor.edit}
					</button>
				</div>
			</div>
			<p className="mt-2 text-text-secondary">{card.back}</p>
			{card.context && <p className="mt-2 text-sm italic text-text-muted">{card.context}</p>}
		</li>
	);
}
