import Link from "next/link";
import { copy } from "@/lib/i18n/copy";

/**
 * Shared authenticated-app header. Rendered once by app/(app)/layout.tsx above
 * each page's own <main>. Mobile-first: wordmark + horizontal nav that scrolls
 * on narrow screens. No gamification chrome.
 *
 */
const NAV = [
	{ href: "/dashboard", key: "dashboard" as const },
	{ href: "/decks", key: "decks" as const },
	{ href: "/mock-tests", key: "mockTests" as const },
	{ href: "/review", key: "review" as const },
];

export function AppHeader() {
	return (
		<header className="border-b border-border bg-bg">
			<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
				<Link href="/dashboard" className="font-display text-lg font-medium text-text">
					Mnemo
				</Link>
				<nav className="flex items-center gap-4 overflow-x-auto text-sm">
					{NAV.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="whitespace-nowrap text-text-secondary hover:text-text"
						>
							{copy.nav[item.key]}
						</Link>
					))}
				</nav>
			</div>
		</header>
	);
}
