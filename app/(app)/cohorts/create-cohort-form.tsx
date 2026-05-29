"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/i18n/copy";
import { createCohortAction } from "./actions";

export function CreateCohortForm() {
	const router = useRouter();
	const t = copy.cohorts;
	const [pending, startTransition] = useTransition();
	const [errored, setErrored] = useState(false);

	function onSubmit(formData: FormData) {
		setErrored(false);
		startTransition(async () => {
			const res = await createCohortAction({
				name: formData.get("name"),
				targetBand: (formData.get("targetBand") as string) || undefined,
				examDate: (formData.get("examDate") as string) || undefined,
			});
			if (res.ok) {
				router.push(`/cohorts/${res.cohortId}`);
				router.refresh();
			} else {
				setErrored(true);
			}
		});
	}

	const fieldCls = "mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-text";

	return (
		<form action={onSubmit} className="space-y-4 rounded-lg border border-border bg-bg-subtle p-5">
			<div>
				<Label htmlFor="name">{t.create.nameLabel}</Label>
				<Input id="name" name="name" required maxLength={120} className="mt-1" />
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label htmlFor="targetBand">{t.create.targetBand}</Label>
					<Input
						id="targetBand"
						name="targetBand"
						type="number"
						min={0}
						max={9}
						step={0.5}
						className="mt-1"
					/>
				</div>
				<div>
					<Label htmlFor="examDate">{t.create.examDate}</Label>
					<input id="examDate" name="examDate" type="date" className={fieldCls} />
				</div>
			</div>
			{errored && <p className="text-sm text-error">{t.create.error}</p>}
			<Button
				type="submit"
				disabled={pending}
				className="bg-accent text-text-inverse hover:bg-accent-hover"
			>
				{pending ? t.create.creating : t.create.submit}
			</Button>
		</form>
	);
}
