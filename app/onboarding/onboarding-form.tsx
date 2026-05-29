"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/i18n/copy";
import { saveOnboarding } from "./actions";

const BANDS = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

export function OnboardingForm() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [errored, setErrored] = useState(false);
	const t = copy.onboarding;

	function onSubmit(formData: FormData) {
		setErrored(false);
		startTransition(async () => {
			const res = await saveOnboarding({
				role: formData.get("role"),
				currentBand: formData.get("currentBand"),
				targetBand: formData.get("targetBand"),
				examDate: (formData.get("examDate") as string) || undefined,
			});
			if (res.ok) {
				router.replace("/dashboard");
				router.refresh();
			} else {
				setErrored(true);
			}
		});
	}

	const selectCls =
		"mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-text";

	return (
		<form action={onSubmit} className="space-y-5">
			<div>
				<Label htmlFor="role">{t.roleLabel}</Label>
				<select id="role" name="role" defaultValue="student" className={selectCls}>
					<option value="student">{t.roleStudent}</option>
					<option value="tutor">{t.roleTutor}</option>
				</select>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label htmlFor="currentBand">{t.currentBand}</Label>
					<select id="currentBand" name="currentBand" defaultValue="6.5" className={selectCls}>
						{BANDS.map((b) => (
							<option key={b} value={b}>
								{b}
							</option>
						))}
					</select>
				</div>
				<div>
					<Label htmlFor="targetBand">{t.targetBand}</Label>
					<select id="targetBand" name="targetBand" defaultValue="7.5" className={selectCls}>
						{BANDS.map((b) => (
							<option key={b} value={b}>
								{b}
							</option>
						))}
					</select>
				</div>
			</div>

			<div>
				<Label htmlFor="examDate">{t.examDate}</Label>
				<input id="examDate" name="examDate" type="date" className={selectCls} />
			</div>

			{errored && <p className="text-sm text-error">{t.error}</p>}

			<Button
				type="submit"
				disabled={pending}
				className="w-full bg-accent text-text-inverse hover:bg-accent-hover"
			>
				{pending ? t.saving : t.submit}
			</Button>
		</form>
	);
}
