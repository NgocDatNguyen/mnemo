import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/i18n/copy";

export const metadata: Metadata = {
	title: copy.terms.title,
};

export default function TermsPage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-bg-subtle px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{copy.terms.title}</CardTitle>
					<CardDescription>{copy.terms.body}</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/" className="text-sm text-accent underline underline-offset-4">
						{copy.terms.backHome}
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
