import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/server";
import { copy } from "@/lib/i18n/copy";
import { SignOutButton } from "./sign-out-button";

/**
 * Dashboard placeholder — Session 5 will replace this with real review/deck UI.
 *
 * Double-protected: middleware redirects unauth → /login already, but we also
 * check here so a middleware misconfig doesn't leak the page.
 */
export default async function DashboardPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const displayName = session.user.name ?? session.user.email;

	return (
		<main className="min-h-screen flex items-center justify-center bg-bg-subtle px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>
						{copy.dashboard.greeting}, {displayName}
					</CardTitle>
					<CardDescription>{copy.dashboard.placeholder}</CardDescription>
				</CardHeader>
				<CardContent>
					<SignOutButton label={copy.dashboard.signOut} />
				</CardContent>
			</Card>
		</main>
	);
}
