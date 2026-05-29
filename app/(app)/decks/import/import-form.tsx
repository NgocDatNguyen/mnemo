"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";
import { importApkg } from "./actions";

type ErrCode = "UNAUTHORIZED" | "NO_FILE" | "UNSUPPORTED" | "EMPTY" | "TOO_LARGE" | "INTERNAL";

export function ImportForm() {
	const router = useRouter();
	const t = copy.anki.import;
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<ErrCode | null>(null);

	const errorMessage = (code: ErrCode): string => {
		if (code === "UNSUPPORTED") return t.errorUnsupported;
		if (code === "TOO_LARGE") return t.errorTooLarge;
		if (code === "EMPTY") return t.errorEmpty;
		return t.error;
	};

	function onSubmit(formData: FormData) {
		setError(null);
		startTransition(async () => {
			const res = await importApkg(formData);
			if (res.ok) {
				router.replace(`/decks/${res.deckId}`);
				router.refresh();
			} else {
				setError(res.error);
			}
		});
	}

	return (
		<form action={onSubmit} className="space-y-4">
			<input
				type="file"
				name="file"
				accept=".apkg"
				required
				className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border file:border-border file:bg-bg-elevated file:px-3 file:py-2 file:text-text"
			/>
			{error && <p className="text-sm text-error">{errorMessage(error)}</p>}
			<Button
				type="submit"
				disabled={pending}
				className="bg-accent text-text-inverse hover:bg-accent-hover"
			>
				{pending ? t.importing : t.submit}
			</Button>
		</form>
	);
}
