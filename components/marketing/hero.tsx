import { copy } from "@/lib/i18n/copy";
import { CtaButtons } from "./cta-buttons";

/**
 * Hero — first thing every visitor sees. Brand-critical.
 *
 * Layout: left-aligned single column. Max-width container holds the headline +
 * subhead at a readable measure (~600px for the subhead). No images, no mascot,
 * no photographs — just typography + a single warm-gold underline accent.
 *
 * The phrase `nhớ trọn đời` uses Fraunces with the WONK axis dialled to 1 to
 * give the italic a hand-set serif character. WONK is exposed by
 * next/font/google's Fraunces import in app/layout.tsx (axes: opsz, SOFT, WONK).
 * Inline `style` is used instead of a Tailwind arbitrary value because
 * font-variation-settings strings with single quotes don't survive Tailwind's
 * arbitrary-value escaping cleanly.
 */
export function Hero({ betaFull = false }: { betaFull?: boolean }) {
	return (
		<section className="bg-bg px-4 pt-24 pb-20 sm:px-8 md:pt-32 md:pb-24">
			<div className="mx-auto max-w-3xl">
				<span className="inline-block rounded-full border border-accent bg-accent-subtle px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-accent">
					{copy.hero.badge}
				</span>

				<h1 className="mt-8 font-display text-4xl leading-[1.1] font-medium tracking-tight text-text md:text-5xl md:leading-[1.05]">
					{copy.hero.headlinePrefix}{" "}
					<em className="font-display italic" style={{ fontVariationSettings: "'WONK' 1" }}>
						{copy.hero.headlineItalic}
					</em>
				</h1>

				<div aria-hidden="true" className="my-8 h-px w-20 bg-accent" />

				<div className="max-w-xl space-y-3 text-base leading-7 text-text-secondary md:text-lg md:leading-8">
					<p>{copy.hero.subhead1}</p>
					<p>{copy.hero.subhead2}</p>
				</div>

				<div className="mt-10">
					<CtaButtons clarifier={copy.hero.ctaClarifier} betaFull={betaFull} />
				</div>
			</div>
		</section>
	);
}
