import Link from "next/link";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";

export function EmptyState() {
	const t = copy.mockTests.empty;
	return (
		<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border-strong bg-bg-elevated px-6 py-16 text-center">
			<div>
				<h2 className="text-lg font-semibold text-text">{t.title}</h2>
				<p className="mt-2 max-w-md text-sm text-text-secondary">{t.body}</p>
			</div>
			<Button asChild className="bg-accent text-text-inverse hover:bg-accent-hover">
				<Link href="/mock-tests/upload">{t.cta}</Link>
			</Button>
		</div>
	);
}
