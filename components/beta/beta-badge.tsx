import { copy } from "@/lib/i18n/copy";

/**
 * "BETA — Miễn phí" badge (CLAUDE.md "Beta Mode" UI signals). Reads the user's
 * betaTester row flag (NOT the BETA_MODE env) — only actual beta testers see it.
 */
export function BetaBadge({ betaTester }: { betaTester: boolean }) {
	if (!betaTester) return null;
	return (
		<span className="rounded-full border border-accent bg-accent-subtle px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-accent">
			{copy.beta.badge}
		</span>
	);
}
