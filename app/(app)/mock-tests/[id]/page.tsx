import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnalysisStatus } from "@/components/mock-tests/analysis-status";
import { WeaknessDisplay } from "@/components/mock-tests/weakness-display";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
	year: "numeric",
	month: "long",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
});

export default async function MockTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const { id } = await params;

	// Scope the query by user_id so another user's testId returns 404, not 403.
	// Avoids leaking existence of resources owned by other users.
	const [test] = await db
		.select()
		.from(mockTests)
		.where(and(eq(mockTests.id, id), eq(mockTests.userId, session.user.id)))
		.limit(1);

	if (!test) notFound();

	const t = copy.mockTests;
	const testTypeLabel = t.card[test.testType];
	const sourceLabel = test.inputSource === "pdf" ? t.card.sourcePdf : t.card.sourcePhoto;
	const isAnalyzed = test.analyzedAt !== null;
	const hasFailed = (test.qualityWarnings ?? []).some((w) => w.type === "analysis_failed");

	return (
		<main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
			<Link href="/mock-tests" className="text-sm text-text-secondary hover:text-text">
				← {t.detail.backToList}
			</Link>

			<div className="mt-4 flex items-start justify-between gap-3">
				<div>
					<h1 className="font-display text-2xl font-medium text-text sm:text-3xl">
						{testTypeLabel}
					</h1>
					<p className="mt-1 text-sm text-text-muted">
						{sourceLabel} · {t.detail.uploadedLabel} {dateFmt.format(test.createdAt)}
					</p>
				</div>
				<span
					className={
						isAnalyzed
							? "shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success"
							: "shrink-0 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-medium text-text-secondary"
					}
				>
					{isAnalyzed ? t.card.statusAnalyzed : t.card.statusPending}
				</span>
			</div>

			{isAnalyzed ? (
				<WeaknessDisplay test={test} />
			) : (
				<AnalysisStatus testId={test.id} key={hasFailed ? "failed" : "polling"} />
			)}
		</main>
	);
}
