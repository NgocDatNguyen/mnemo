import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/mock-tests/empty-state";
import { MockTestCard } from "@/components/mock-tests/mock-test-card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { mockTests } from "@/lib/db/schema";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

export default async function MockTestsListPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const tests = await db
		.select()
		.from(mockTests)
		.where(eq(mockTests.userId, session.user.id))
		.orderBy(desc(mockTests.createdAt));

	const t = copy.mockTests;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl font-medium text-text sm:text-3xl">{t.pageTitle}</h1>
					<p className="mt-2 text-sm text-text-secondary">{t.pageSubhead}</p>
				</div>
				{tests.length > 0 && (
					<Button asChild className="bg-accent text-text-inverse hover:bg-accent-hover">
						<Link href="/mock-tests/upload">{t.uploadCta}</Link>
					</Button>
				)}
			</div>

			<div className="mt-8">
				{tests.length === 0 ? (
					<EmptyState />
				) : (
					<ul className="space-y-3">
						{tests.map((test) => (
							<li key={test.id}>
								<MockTestCard test={test} />
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	);
}
