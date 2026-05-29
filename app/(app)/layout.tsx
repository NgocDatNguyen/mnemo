import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";
import { auth } from "@/lib/auth/server";

/**
 * Authenticated app shell. Fetches the session once and renders the shared
 * header above each page (pages keep their own <main>, so no double chrome).
 *
 * Middleware already gates (app)/* on cookie presence; this is the server-side
 * full-session check. Onboarding gate (roadmap step 9) will live here too.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	return (
		<div className="flex min-h-screen flex-col bg-bg">
			<AppHeader />
			{children}
		</div>
	);
}
