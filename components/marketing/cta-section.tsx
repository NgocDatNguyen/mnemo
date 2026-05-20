import { copy } from "@/lib/i18n/copy";
import { CtaButtons } from "./cta-buttons";

export function CtaSection() {
	return (
		<section className="bg-bg px-4 py-20 sm:px-8 md:py-28">
			<div className="mx-auto max-w-2xl">
				<div aria-hidden="true" className="mb-8 h-px w-20 bg-accent" />

				<h2 className="font-display text-2xl font-medium tracking-tight text-text md:text-3xl">
					{copy.ctaSection.heading}
				</h2>
				<p className="mt-3 text-base text-text-secondary md:text-lg">{copy.ctaSection.body}</p>

				<div className="mt-8">
					<CtaButtons />
				</div>
			</div>
		</section>
	);
}
