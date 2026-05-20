import Link from "next/link";
import type { MockTest } from "@/lib/db/schema/mock-tests";
import { copy } from "@/lib/i18n/copy";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
});

export function MockTestCard({ test }: { test: MockTest }) {
	const t = copy.mockTests.card;
	const isAnalyzed = test.analyzedAt !== null;
	const testTypeLabel = t[test.testType];
	const sourceLabel = test.inputSource === "pdf" ? t.sourcePdf : t.sourcePhoto;

	return (
		<Link
			href={`/mock-tests/${test.id}`}
			className="block rounded-lg border border-border bg-bg-elevated p-4 transition-colors hover:border-border-strong hover:bg-bg-subtle"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-text">{testTypeLabel}</p>
					<p className="mt-1 text-xs text-text-muted">
						{sourceLabel} · {dateFmt.format(test.createdAt)}
					</p>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
						isAnalyzed ? "bg-success-bg text-success" : "bg-bg-subtle text-text-secondary",
					)}
				>
					{isAnalyzed ? t.statusAnalyzed : t.statusPending}
				</span>
			</div>
		</Link>
	);
}
