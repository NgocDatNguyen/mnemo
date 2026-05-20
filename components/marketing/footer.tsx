import Link from "next/link";
import { copy } from "@/lib/i18n/copy";

export function Footer() {
	return (
		<footer className="border-t border-border bg-bg px-4 py-10 sm:px-8 md:py-12">
			<div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
				<div className="space-y-1">
					<p className="font-display text-xl font-medium text-text">Mnemo</p>
					<p className="text-[13px] italic text-text-muted">{copy.footer.tagline}</p>
					<p className="text-xs text-text-muted">{copy.footer.attribution}</p>
				</div>

				<nav className="flex gap-6 text-[13px] text-text-secondary">
					<Link href="/privacy" className="hover:underline hover:underline-offset-4">
						{copy.footer.linkPrivacy}
					</Link>
					<Link href="/terms" className="hover:underline hover:underline-offset-4">
						{copy.footer.linkTerms}
					</Link>
				</nav>
			</div>
		</footer>
	);
}
