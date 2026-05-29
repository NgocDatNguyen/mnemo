import type { MetadataRoute } from "next";

/**
 * PWA manifest (CLAUDE.md beta launch criterion: "Review flow on mobile, PWA
 * installable"). display:standalone + 192/512 icons make the app installable on
 * mobile home screens. Colors from the locked design tokens.
 *
 * Icons are a simple geometric "M" placeholder — replace with a designed brand
 * icon before public launch.
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Mnemo",
		short_name: "Mnemo",
		description: "AI flashcard builder cho người học IELTS.",
		start_url: "/dashboard",
		display: "standalone",
		background_color: "#FAFAF7",
		theme_color: "#1A2547",
		lang: "vi",
		icons: [
			{ src: "/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
