"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/lib/i18n/copy";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3_000;
const TIMEOUT_MS = 90_000;

type StatusResponse = { analyzedAt: string | null; hasError: boolean };

type RemoteState =
	| { kind: "polling" }
	| { kind: "ready" }
	| { kind: "failed" }
	| { kind: "timeout" };

export function AnalysisStatus({ testId }: { testId: string }) {
	const router = useRouter();
	const t = copy.mockTests.detail.analysis;

	const [state, setState] = useState<RemoteState>({ kind: "polling" });
	const [retrying, setRetrying] = useState(false);
	const startedAt = useRef<number>(Date.now());

	useEffect(() => {
		if (state.kind !== "polling") return;
		let cancelled = false;

		const poll = async () => {
			try {
				const res = await fetch(`/api/mock-tests/${testId}/status`, { cache: "no-store" });
				if (!res.ok) return;
				const data = (await res.json()) as StatusResponse;
				if (cancelled) return;
				if (data.analyzedAt) {
					setState({ kind: "ready" });
					router.refresh();
				} else if (data.hasError) {
					setState({ kind: "failed" });
				} else if (Date.now() - startedAt.current >= TIMEOUT_MS) {
					setState({ kind: "timeout" });
				}
			} catch {
				// Transient network error — keep polling until timeout.
			}
		};

		void poll();
		const interval = setInterval(poll, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [state.kind, testId, router]);

	const handleRetry = async () => {
		if (retrying) return;
		setRetrying(true);
		try {
			const res = await fetch(`/api/mock-tests/${testId}/analyze`, { method: "POST" });
			if (res.ok) {
				router.refresh();
			} else {
				// Keep the failed state visible; the retry button stays available.
				setState({ kind: "failed" });
			}
		} catch {
			setState({ kind: "failed" });
		} finally {
			setRetrying(false);
			startedAt.current = Date.now();
		}
	};

	if (state.kind === "polling") {
		return (
			<div className="mt-8 rounded-lg border border-border bg-bg-elevated px-6 py-12 text-center">
				<div className="mx-auto h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
				<h2 className="mt-4 text-base font-semibold text-text">{t.inFlight.title}</h2>
				<p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{t.inFlight.body}</p>
			</div>
		);
	}

	if (state.kind === "ready") {
		return null;
	}

	const isTimeout = state.kind === "timeout";
	const title = isTimeout ? t.timeout.title : t.failed.title;
	const body = isTimeout ? t.timeout.body : t.failed.body;

	return (
		<div
			role="alert"
			className="mt-8 rounded-lg border border-error/30 bg-error-bg px-6 py-12 text-center"
		>
			<h2 className="text-base font-semibold text-error">{title}</h2>
			<p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{body}</p>
			<button
				type="button"
				onClick={() => void handleRetry()}
				disabled={retrying}
				className={cn(
					"mt-4 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse transition-colors",
					"hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50",
				)}
			>
				{retrying ? t.failed.retrying : t.failed.retry}
			</button>
		</div>
	);
}
