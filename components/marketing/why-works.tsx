import { copy } from "@/lib/i18n/copy";

/**
 * Subtle 3x3 dot grid in warm gold — sits to the left of the heading.
 * Inline component (used in one place) instead of a separate file.
 */
function DotPattern() {
	const dots = [];
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 3; col++) {
			dots.push(<circle key={`${row}-${col}`} cx={3 + col * 12} cy={3 + row * 12} r={3} />);
		}
	}
	return (
		<svg
			aria-hidden="true"
			width="30"
			height="30"
			viewBox="0 0 30 30"
			className="text-accent"
			fill="currentColor"
		>
			{dots}
		</svg>
	);
}

export function WhyWorks() {
	return (
		<section className="bg-bg px-4 py-20 sm:px-8 md:py-24">
			<div className="mx-auto max-w-3xl">
				<header className="flex items-center gap-4">
					<DotPattern />
					<h2 className="text-xl font-semibold tracking-tight text-text md:text-2xl">
						{copy.whyWorks.heading}
					</h2>
				</header>

				<div className="mt-10 space-y-6 text-base leading-7 text-text md:text-[17px] md:leading-8">
					<p>{copy.whyWorks.para1}</p>
					<p>{copy.whyWorks.para2}</p>
					<p>{copy.whyWorks.para3}</p>
				</div>
			</div>
		</section>
	);
}
