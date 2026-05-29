import { CtaSection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { Methodology } from "@/components/marketing/methodology";
import { PricingCallout } from "@/components/marketing/pricing-callout";
import { WhyWorks } from "@/components/marketing/why-works";
import { canAcceptNewUser } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

function SectionDivider() {
	return <div className="mx-auto h-px max-w-5xl bg-border" aria-hidden="true" />;
}

export default async function LandingPage() {
	// When beta is full, route the primary CTA to /waitlist instead of /login.
	const betaFull = !(await canAcceptNewUser());

	return (
		<>
			<Hero betaFull={betaFull} />
			<SectionDivider />
			<Methodology />
			<SectionDivider />
			<WhyWorks />
			<PricingCallout />
			<CtaSection betaFull={betaFull} />
			<Footer />
		</>
	);
}
