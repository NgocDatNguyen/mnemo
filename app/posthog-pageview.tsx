"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

function PageviewTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHog();

	useEffect(() => {
		if (!pathname || !posthog) return;
		const qs = searchParams?.toString();
		const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
		posthog.capture("$pageview", { $current_url: url });
	}, [pathname, searchParams, posthog]);

	return null;
}

export function PostHogPageview() {
	return (
		<Suspense fallback={null}>
			<PageviewTracker />
		</Suspense>
	);
}
