import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionWithRole } from "@/lib/auth/role";
import { listCohortsByTutor } from "@/lib/db/queries";
import { copy } from "@/lib/i18n/copy";
import { CreateCohortForm } from "./create-cohort-form";

export const dynamic = "force-dynamic";

export default async function CohortsPage() {
	const ctx = await getSessionWithRole();
	if (!ctx) redirect("/login");
	if (ctx.role !== "tutor") redirect("/dashboard"); // role-gated

	const cohorts = await listCohortsByTutor(ctx.userId);
	const t = copy.cohorts;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
			<header className="mb-8">
				<h1 className="font-display text-2xl font-medium text-text">{t.pageTitle}</h1>
				<p className="mt-2 text-text-secondary">{t.pageSubhead}</p>
			</header>

			<div className="mb-8">
				<CreateCohortForm />
			</div>

			{cohorts.length === 0 ? (
				<p className="text-text-secondary">{t.empty}</p>
			) : (
				<ul className="space-y-3">
					{cohorts.map((c) => (
						<li key={c.id}>
							<Link
								href={`/cohorts/${c.id}`}
								className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3 hover:border-border-strong"
							>
								<span className="font-medium text-text">{c.name}</span>
								<span aria-hidden="true" className="text-text-muted">
									→
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
