import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReviewSession } from "@/components/review/review-session";
import { auth } from "@/lib/auth/server";
import { getDueCards } from "@/lib/db/queries";
import { copy } from "@/lib/i18n/copy";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");

	const due = await getDueCards(session.user.id);
	const t = copy.review;

	return (
		<main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
			<h1 className="mb-6 font-display text-2xl font-medium text-text">{t.pageTitle}</h1>
			<ReviewSession initialCards={due} />
		</main>
	);
}
