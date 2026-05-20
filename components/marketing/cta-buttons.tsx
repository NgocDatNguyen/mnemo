import Link from "next/link";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";

/**
 * Shared primary + secondary CTAs used by both Hero and CtaSection.
 *
 * Primary: solid warm-gold button → /login (Better Auth magic-link form).
 * Secondary: text link with underline → /waitlist (always shown, never gated on cap).
 *
 * Optional clarifier text rendered below — Hero uses it ("Không cần mật khẩu…"),
 * CtaSection passes none.
 */
type Props = {
	clarifier?: string;
	align?: "start" | "center";
};

export function CtaButtons({ clarifier, align = "start" }: Props) {
	const alignment = align === "center" ? "items-center text-center" : "items-start";
	return (
		<div className={`flex flex-col gap-3 ${alignment}`}>
			<div className="flex flex-col gap-3 sm:flex-row">
				<Button asChild size="lg" className="bg-accent text-text-inverse hover:bg-accent-hover">
					<Link href="/login">{copy.hero.ctaPrimary}</Link>
				</Button>
				<Button
					asChild
					variant="ghost"
					size="lg"
					className="text-text-secondary underline underline-offset-4"
				>
					<Link href="/waitlist">{copy.hero.ctaSecondary}</Link>
				</Button>
			</div>
			{clarifier && <p className="text-xs text-text-muted">{clarifier}</p>}
		</div>
	);
}
