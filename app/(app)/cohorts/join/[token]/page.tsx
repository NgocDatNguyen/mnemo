import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/server";
import { joinCohort } from "@/lib/db/queries";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

/**
 * Student joins a cohort via an invite link. Any authenticated user can join
 * (not role-gated) — the tutor is rejected from joining their own cohort.
 */
export default async function JoinCohortPage({ params }: { params: Promise<{ token: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const { token } = await params;
	const result = await joinCohort(token, session.user.id);
	const t = copy.cohorts.join;

	const message = result.ok
		? t.success.replace("{name}", result.cohortName)
		: result.reason === "is_tutor"
			? t.errorTutor
			: t.errorNotFound;

	return (
		<main className="flex min-h-screen items-center justify-center bg-bg-subtle px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{result.ok ? t.joinedTitle : t.errorTitle}</CardTitle>
					<CardDescription>{message}</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/dashboard" className="text-sm text-accent underline underline-offset-4">
						{t.toDashboard}
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
