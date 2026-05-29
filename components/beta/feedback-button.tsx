"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";
import { submitFeedback } from "./feedback-actions";

type FeedbackType = "bug" | "feature_request" | "general" | "praise" | "complaint";

/**
 * Prominent beta feedback CTA (CLAUDE.md "Beta Mode" UI signals). Native form,
 * writes to the feedback table with captured page URL + device info.
 */
export function FeedbackButton() {
	const t = copy.beta.feedback;
	const [open, setOpen] = useState(false);
	const [done, setDone] = useState(false);
	const [errored, setErrored] = useState(false);
	const [pending, startTransition] = useTransition();

	function onSubmit(formData: FormData) {
		setErrored(false);
		startTransition(async () => {
			const res = await submitFeedback({
				type: formData.get("type") as FeedbackType,
				message: formData.get("message"),
				pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
				deviceInfo:
					typeof window !== "undefined"
						? {
								userAgent: navigator.userAgent,
								viewport: { width: window.innerWidth, height: window.innerHeight },
								platform: navigator.platform,
							}
						: undefined,
			});
			if (res.ok) {
				setDone(true);
			} else {
				setErrored(true);
			}
		});
	}

	const selectCls =
		"w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text";

	return (
		<div className="relative">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => {
					setOpen((v) => !v);
					setDone(false);
				}}
			>
				{t.cta}
			</Button>

			{open && (
				<div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-border bg-bg-elevated p-4 shadow-sm">
					{done ? (
						<p className="text-sm text-text-secondary">{t.thanks}</p>
					) : (
						<form action={onSubmit} className="space-y-3">
							<select
								name="type"
								defaultValue="general"
								className={selectCls}
								aria-label={t.typeLabel}
							>
								<option value="general">{t.types.general}</option>
								<option value="bug">{t.types.bug}</option>
								<option value="feature_request">{t.types.feature_request}</option>
								<option value="praise">{t.types.praise}</option>
								<option value="complaint">{t.types.complaint}</option>
							</select>
							<textarea
								name="message"
								required
								rows={4}
								placeholder={t.placeholder}
								className={selectCls}
							/>
							{errored && <p className="text-sm text-error">{t.error}</p>}
							<Button
								type="submit"
								size="sm"
								disabled={pending}
								className="w-full bg-accent text-text-inverse hover:bg-accent-hover"
							>
								{pending ? t.sending : t.submit}
							</Button>
						</form>
					)}
				</div>
			)}
		</div>
	);
}
