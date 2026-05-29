import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { copy } from "@/lib/i18n/copy";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const t = copy.anki.import;

	return (
		<main className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
			<Link href="/decks" className="text-sm text-accent hover:underline">
				{copy.decks.detail.backToList}
			</Link>
			<h1 className="mt-4 font-display text-2xl font-medium text-text">{t.title}</h1>
			<p className="mt-2 text-sm text-text-secondary">{t.subhead}</p>
			<div className="mt-6">
				<ImportForm />
			</div>
		</main>
	);
}
