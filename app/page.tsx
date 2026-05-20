import { CtaSection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { Methodology } from "@/components/marketing/methodology";
import { PricingCallout } from "@/components/marketing/pricing-callout";
import { WhyWorks } from "@/components/marketing/why-works";

function SectionDivider() {
	return <div className="mx-auto h-px max-w-5xl bg-border" aria-hidden="true" />;
}

export default function LandingPage() {
	return (
		<>
			<Hero />
			<SectionDivider />
			<Methodology />
			<SectionDivider />
			<WhyWorks />
			<PricingCallout />
			<CtaSection />
			<Footer />
		</>
	);
}
