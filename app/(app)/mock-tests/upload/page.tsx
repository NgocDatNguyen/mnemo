import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/mock-tests/upload-form";
import { auth } from "@/lib/auth/server";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

export default async function UploadMockTestPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const t = copy.mockTests.upload;

	return (
		<main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
			<Link href="/mock-tests" className="text-sm text-text-secondary hover:text-text">
				← {t.back}
			</Link>
			<h1 className="mt-4 font-display text-2xl font-medium text-text sm:text-3xl">
				{t.pageTitle}
			</h1>
			<p className="mt-2 text-sm text-text-secondary">{t.pageSubhead}</p>
			<div className="mt-8">
				<UploadForm />
			</div>
		</main>
	);
}
