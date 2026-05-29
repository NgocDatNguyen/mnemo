import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { copy } from "@/lib/i18n/copy";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

/**
 * First-run onboarding. Lives OUTSIDE the (app) group so the layout's onboarding
 * gate can redirect here without a loop. Sends already-onboarded users to the dashboard.
 */
export default async function OnboardingPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const [row] = await db
		.select({ onboardingCompletedAt: users.onboardingCompletedAt })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (row?.onboardingCompletedAt) redirect("/dashboard");

	const t = copy.onboarding;

	return (
		<main className="flex min-h-screen items-center justify-center bg-bg-subtle px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{t.title}</CardTitle>
					<CardDescription>{t.subhead}</CardDescription>
				</CardHeader>
				<CardContent>
					<OnboardingForm />
				</CardContent>
			</Card>
		</main>
	);
}
