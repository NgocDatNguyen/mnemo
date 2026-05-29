import type { MockTest } from "@/lib/db/schema/mock-tests";
import type { MockTestQualityWarning, WeaknessCluster } from "@/lib/db/types";
import { copy } from "@/lib/i18n/copy";
import { cn } from "@/lib/utils";
import { GenerateCardsButton } from "./generate-cards-button";

const SEVERITY_STYLES: Record<WeaknessCluster["severity"], string> = {
	minor: "bg-info-bg text-info",
	moderate: "bg-warning-bg text-warning",
	major: "bg-error-bg text-error",
};

function HeaderStat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-md border border-border bg-bg-elevated px-3 py-2">
			<p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
			<p className="mt-1 font-mono text-lg font-medium text-text">{value}</p>
		</div>
	);
}

function ClusterCard({ cluster }: { cluster: WeaknessCluster }) {
	const t = copy.mockTests.detail.analysis.cluster;
	return (
		<article className="rounded-lg border border-border bg-bg-elevated p-5">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs uppercase tracking-wide text-text-muted">
						{t.typeLabels[cluster.type]}
					</p>
					<h3 className="mt-1 text-base font-semibold text-text">{cluster.theme}</h3>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
						SEVERITY_STYLES[cluster.severity],
					)}
				>
					{t.severityLabels[cluster.severity]}
				</span>
			</header>

			<section className="mt-4">
				<p className="text-xs uppercase tracking-wide text-text-muted">{t.examplesHeading}</p>
				<ul className="mt-2 space-y-3">
					{cluster.examples.map((ex, idx) => (
						<li
							key={`${cluster.theme}-${idx}`}
							className="rounded-md border border-border bg-bg-subtle px-3 py-2"
						>
							<p className="text-sm text-text-secondary">
								<span className="font-medium text-text-muted">{t.errorLabel}:</span>{" "}
								<span className="font-mono text-text">{ex.user_error}</span>
							</p>
							<p className="mt-1 text-sm text-text-secondary">
								<span className="font-medium text-text-muted">{t.correctionLabel}:</span>{" "}
								<span className="font-mono text-success">{ex.correction}</span>
							</p>
							<p className="mt-2 text-sm text-text-secondary">{ex.explanation_vi}</p>
						</li>
					))}
				</ul>
			</section>

			<section className="mt-4">
				<p className="text-xs uppercase tracking-wide text-text-muted">{t.practiceHeading}</p>
				<p className="mt-2 text-sm text-text-secondary">{cluster.suggested_practice_vi}</p>
			</section>
		</article>
	);
}

function QualityWarnings({ warnings }: { warnings: MockTestQualityWarning[] }) {
	const t = copy.mockTests.detail.analysis.qualityWarnings;
	const visible = warnings.filter((w) => w.type !== "analysis_failed");
	if (visible.length === 0) return null;
	return (
		<div className="mt-6 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3">
			<p className="text-sm font-semibold text-warning">{t.heading}</p>
			<ul className="mt-2 space-y-1 text-sm text-text-secondary">
				{visible.map((w, idx) => (
					<li key={`${w.type}-${idx}`}>
						<span className="font-medium text-text">
							{t.types[w.type as keyof typeof t.types]}:
						</span>{" "}
						{w.message_vi}
					</li>
				))}
			</ul>
		</div>
	);
}

export function WeaknessDisplay({ test }: { test: MockTest }) {
	const t = copy.mockTests.detail.analysis;
	const clusters = test.weaknessClusters ?? [];
	const warnings = test.qualityWarnings ?? [];

	const bandDisplay =
		test.bandEstimate === null || test.bandEstimate === undefined
			? t.header.bandUnknown
			: test.bandEstimate.toFixed(1);

	return (
		<div className="mt-6">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{test.totalQuestions !== null && test.totalQuestions > 0 && (
					<HeaderStat label={t.header.totalQuestions} value={test.totalQuestions ?? 0} />
				)}
				{test.correctCount !== null && (test.totalQuestions ?? 0) > 0 && (
					<HeaderStat label={t.header.correctCount} value={test.correctCount ?? 0} />
				)}
				<HeaderStat label={t.header.bandEstimate} value={bandDisplay} />
			</div>

			<QualityWarnings warnings={warnings} />

			<div className="mt-6 space-y-4">
				{clusters.map((cluster, idx) => (
					<ClusterCard key={`${cluster.type}-${idx}`} cluster={cluster} />
				))}
			</div>

			<GenerateCardsButton testId={test.id} existingDeckId={test.generatedDeckId} />
		</div>
	);
}
