import Link from "next/link";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";

/**
 * Shared primary + secondary CTAs used by both Hero and CtaSection.
 *
 * Primary: solid warm-gold button. When beta is NOT full → /login (magic link).
 * When `betaFull` (canAcceptNewUser() === false, computed server-side on the
 * landing page) → the primary points to /waitlist so a visitor who can't sign up
 * is routed straight to the waitlist instead of bouncing off the cap at /login.
 * Secondary always → /waitlist.
 */
type Props = {
	clarifier?: string;
	align?: "start" | "center";
	betaFull?: boolean;
};

export function CtaButtons({ clarifier, align = "start", betaFull = false }: Props) {
	const alignment = align === "center" ? "items-center text-center" : "items-start";
	return (
		<div className={`flex flex-col gap-3 ${alignment}`}>
			<div className="flex flex-col gap-3 sm:flex-row">
				<Button asChild size="lg" className="bg-accent text-text-inverse hover:bg-accent-hover">
					<Link href={betaFull ? "/waitlist" : "/login"}>
						{betaFull ? copy.hero.ctaSecondary : copy.hero.ctaPrimary}
					</Link>
				</Button>
				{!betaFull && (
					<Button
						asChild
						variant="ghost"
						size="lg"
						className="text-text-secondary underline underline-offset-4"
					>
						<Link href="/waitlist">{copy.hero.ctaSecondary}</Link>
					</Button>
				)}
			</div>
			{clarifier && <p className="text-xs text-text-muted">{clarifier}</p>}
		</div>
	);
}
