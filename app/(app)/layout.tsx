import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Authenticated app shell. Fetches the session once and renders the shared
 * header above each page (pages keep their own <main>, so no double chrome).
 *
 * Middleware already gates (app)/* on cookie presence; this is the server-side
 * full-session check. Onboarding gate: a user who hasn't completed onboarding is
 * sent to /onboarding (a top-level route OUTSIDE this group, so no redirect loop).
 * The gate lives here, not middleware — middleware is cookie-only and can't read
 * onboarding_completed_at.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const [row] = await db
		.select({ onboardingCompletedAt: users.onboardingCompletedAt, role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!row?.onboardingCompletedAt) redirect("/onboarding");

	const betaTester = (session.user as { betaTester?: boolean }).betaTester ?? false;

	return (
		<div className="flex min-h-screen flex-col bg-bg">
			<AppHeader betaTester={betaTester} isTutor={row.role === "tutor"} />
			{children}
		</div>
	);
}
