import { copy } from "@/lib/i18n/copy";

export function PricingCallout() {
	return (
		<section className="bg-bg px-4 py-16 sm:px-8 md:py-20">
			<div className="mx-auto max-w-2xl">
				<div className="rounded-lg border-l-4 border-accent bg-bg-subtle p-8 md:p-10">
					<p className="text-base leading-7 text-text md:text-[17px] md:leading-8">
						{copy.pricingCallout.body}
					</p>
				</div>
			</div>
		</section>
	);
}
