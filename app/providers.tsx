"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
		if (!key || posthog.__loaded) return;
		posthog.init(key, {
			api_host: host,
			capture_pageview: false,
			capture_pageleave: true,
			person_profiles: "identified_only",
		});
	}, []);

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
