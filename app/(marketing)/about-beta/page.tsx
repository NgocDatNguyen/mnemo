import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/lib/i18n/copy";

export const metadata: Metadata = { title: copy.aboutBeta.title };

export default function AboutBetaPage() {
	const t = copy.aboutBeta;
	return (
		<main className="mx-auto w-full max-w-2xl px-4 py-16">
			<h1 className="font-display text-3xl font-medium text-text">{t.title}</h1>
			<div className="mt-8 space-y-4 text-text-secondary leading-7">
				{t.paragraphs.map((p) => (
					<p key={p.slice(0, 32)}>{p}</p>
				))}
			</div>
			<Link
				href="/"
				className="mt-10 inline-block text-sm text-accent underline underline-offset-4"
			>
				{t.backHome}
			</Link>
		</main>
	);
}
