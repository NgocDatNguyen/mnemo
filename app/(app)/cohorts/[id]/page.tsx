import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionWithRole } from "@/lib/auth/role";
import { getCohortForTutor } from "@/lib/db/queries";
import { getReviewSummary } from "@/lib/db/queries/stats";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

export default async function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const ctx = await getSessionWithRole();
	if (!ctx) redirect("/login");
	if (ctx.role !== "tutor") redirect("/dashboard");

	const { id } = await params;
	const result = await getCohortForTutor(id, ctx.userId);
	if (!result) notFound(); // not found OR not this tutor's

	const { cohort, members } = result;
	const t = copy.cohorts;

	// Per-member measured retention (small cohorts → a query each is fine).
	const withStats = await Promise.all(
		members.map(async (m) => ({ ...m, summary: await getReviewSummary(m.userId) })),
	);

	const inviteUrl = `${process.env.BETTER_AUTH_URL ?? ""}/cohorts/join/${cohort.inviteToken}`;
	const pct = (v: number) => `${Math.round(v * 100)}%`;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
			<Link href="/cohorts" className="text-sm text-accent hover:underline">
				{t.backToList}
			</Link>
			<h1 className="mt-4 font-display text-2xl font-medium text-text">{cohort.name}</h1>

			<section className="mt-6 rounded-lg border border-border bg-bg-subtle p-4">
				<p className="text-xs uppercase tracking-wide text-text-muted">{t.inviteLabel}</p>
				<p className="mt-1 break-all font-mono text-sm text-text-secondary">{inviteUrl}</p>
			</section>

			<section className="mt-8">
				<h2 className="text-sm font-medium text-text-secondary">
					{t.membersLabel} ({withStats.length})
				</h2>
				{withStats.length === 0 ? (
					<p className="mt-3 text-text-secondary">{t.noMembers}</p>
				) : (
					<ul className="mt-3 space-y-2">
						{withStats.map((m) => (
							<li
								key={m.userId}
								className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3"
							>
								<div className="min-w-0">
									<p className="truncate font-medium text-text">{m.name ?? m.email}</p>
									<p className="text-xs text-text-muted">{m.email}</p>
								</div>
								<div className="shrink-0 text-right">
									<p className="font-mono text-sm tabular-nums text-text">
										{m.summary.totalReviews > 0 ? pct(m.summary.overallRetention) : "—"}
									</p>
									<p className="text-xs text-text-muted">
										{m.summary.totalReviews} {t.reviewsLabel}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}
