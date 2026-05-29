/**
 * Shared loading state for all (app) routes — shown during server-component data
 * fetches so navigation doesn't flash a blank screen. Calm, token-styled skeleton;
 * no spinner gimmickry (anti-gamification: quiet, not attention-grabbing).
 */
export default function AppLoading() {
	return (
		<div
			className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12"
			aria-busy="true"
			aria-live="polite"
		>
			<div className="h-7 w-48 animate-pulse rounded bg-bg-subtle" />
			<div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-bg-subtle" />
			<div className="mt-8 space-y-3">
				<div className="h-16 animate-pulse rounded-lg bg-bg-subtle" />
				<div className="h-16 animate-pulse rounded-lg bg-bg-subtle" />
				<div className="h-16 animate-pulse rounded-lg bg-bg-subtle" />
			</div>
			<span className="sr-only">Đang tải…</span>
		</div>
	);
}
