import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getDueCount } from "@/lib/db/queries";
import { getReviewSummary, getWeeklyRetention } from "@/lib/db/queries/stats";
import { copy } from "@/lib/i18n/copy";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

/**
 * Dashboard — retention surface for the serious learner. Measured retention from
 * review_logs (not FSRS retrievability). Analytical, never gamified: no streaks,
 * no celebrations, muted colors, Fraunces tabular numbers.
 */
export default async function DashboardPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const userId = session.user.id;
	const [dueCount, summary, weekly] = await Promise.all([
		getDueCount(userId),
		getReviewSummary(userId),
		getWeeklyRetention(userId),
	]);

	const t = copy.dashboard;
	const displayName = session.user.name ?? session.user.email;
	const pct = (v: number) => `${Math.round(v * 100)}%`;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
			<div className="flex items-start justify-between gap-4">
				<h1 className="font-display text-2xl font-medium text-text">
					{t.greeting}, {displayName}
				</h1>
				<SignOutButton label={t.signOut} />
			</div>

			{summary.totalReviews === 0 ? (
				<div className="mt-8 rounded-lg border border-border bg-bg-subtle p-8 text-center">
					<h2 className="font-medium text-text">{t.empty.title}</h2>
					<p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{t.empty.body}</p>
					<Link
						href="/mock-tests/upload"
						className="mt-5 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover"
					>
						{t.empty.cta}
					</Link>
				</div>
			) : (
				<>
					<div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
						<Link
							href="/review"
							className="rounded-lg border border-border bg-bg-elevated p-4 hover:border-border-strong"
						>
							<p className="text-xs uppercase tracking-wide text-text-muted">{t.dueToday}</p>
							<p className="mt-1 font-display text-3xl tabular-nums text-text">{dueCount}</p>
							<p className="mt-1 text-xs text-accent">{t.reviewNow} →</p>
						</Link>
						<div className="rounded-lg border border-border bg-bg-elevated p-4">
							<p className="text-xs uppercase tracking-wide text-text-muted">{t.totalReviews}</p>
							<p className="mt-1 font-display text-3xl tabular-nums text-text">
								{summary.totalReviews}
							</p>
						</div>
						<div className="rounded-lg border border-border bg-bg-elevated p-4">
							<p className="text-xs uppercase tracking-wide text-text-muted">
								{t.overallRetention}
							</p>
							<p className="mt-1 font-display text-3xl tabular-nums text-text">
								{pct(summary.overallRetention)}
							</p>
						</div>
					</div>

					{weekly.length > 0 && (
						<section className="mt-8">
							<h2 className="text-sm font-medium text-text-secondary">{t.retentionTrend}</h2>
							<ul className="mt-3 space-y-2">
								{weekly.map((w) => (
									<li key={w.weekStart} className="flex items-center gap-3">
										<span className="w-20 shrink-0 font-mono text-xs text-text-muted">
											{w.weekStart}
										</span>
										<span className="h-2 flex-1 overflow-hidden rounded-full bg-bg-subtle">
											<span
												className="block h-full rounded-full bg-success"
												style={{ width: pct(w.retention) }}
											/>
										</span>
										<span className="w-20 shrink-0 text-right font-mono text-xs text-text-secondary">
											{pct(w.retention)} ({w.total})
										</span>
									</li>
								))}
							</ul>
						</section>
					)}
				</>
			)}
		</main>
	);
}
